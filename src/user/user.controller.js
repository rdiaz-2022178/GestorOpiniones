import User from './user.model.js'
import { encrypt, comparePassword, checkUpdate, checkUpdateClient } from '../../utils/validator.js'
import { generateJwt } from '../../utils/jwt.js'
import jwt from 'jsonwebtoken'

export const test = (req, res) => {
    console.log('Test is running')
    res.send({ message: 'test good' })
}

export const defaultAdmin = async () => {
    try {
        const existingUser = await User.findOne({ username: 'default' });

        if (existingUser) {
            return;
        }
        let data = {
            name: 'Default',
            username: 'default',
            email: 'default@gmail.com',
            password: await encrypt('hola'),
        }

        let user = new User(data)
        await user.save()

    } catch (error) {
        console.error(error)
    }
}

export const signUp = async (req, res) => {
    try {
        let data = req.body
        let existingUser = await User.findOne({ username: data.username });
        if (existingUser) {
            return res.status(400).send({ message: 'Username is already in use' });
        }
        data.password = await encrypt(data.password)
        let user = new User(data)
        await user.save()
        return res.send({ message: `Registered successfully, can be logged with username ${user.username}` })
    } catch (err) {
        console.error(err)
        return res.status(500).send({ message: 'Error registering user', err: err })
    }
}

export const login = async (req, res) => {
    try {
        let { user, password } = req.body
        let users = await User.findOne({
            $or: [
                { username: user },
                { email: user }
            ]
        });
        if (users && await comparePassword(password, users.password)) {
            let loggedUser = {
                uid: users.id,
                username: users.username,
                email: users.email,
                name: users.name,
            }
            let token = await generateJwt(loggedUser)
            return res.send({ message: `Welcome ${loggedUser.name}`, loggedUser, token })

        }
        return res.status(404).send({ message: 'Invalid credentials' })

    } catch (err) {
        console.error(err)
        return res.status(500).send({ message: 'Error to login' })
    }
}

export const edit = async (req, res) => {
    try {
        let data = req.body;
        let { id } = req.params
        let uid = req.user._id
        let updated = checkUpdateClient(data, id)
        if(id != uid) return  res.status(401).send({ message: 'you can only update your account' })
        if (!updated) return res.status(400).send({ message: 'Have submitted some data that cannot be updated or missing data' })
        let updatedUsers = await User.findOneAndUpdate(
            { _id: id }, //ObjectsId <- hexadecimales (Hora sys, Version Mongo, Llave privada...)
            data, //Los datos que se van a actualizar
            { new: true } //Objeto de la BD ya actualizado
        )
        if (!updatedUsers) return res.status(401).send({ message: 'User not found and not updated' })
        return res.send({ message: 'Updated user', updatedUsers })
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error updating user .', error: error });
    }
}

export const editPassword = async (req, res) => {
    try {
        let { oldPassword, newPassword } = req.body;
        let { id } = req.params;
        let uid = req.user._id


        // Verificar que el usuario esté intentando actualizar su propia cuenta
        if (id != uid) 
            return res.status(401).send({ message: 'You can only update your own account' });

        // Verificar que se haya enviado una nueva contraseña
        if (!newPassword) 
            return res.status(400).send({ message: 'New password is missing' });

        // Obtener el usuario de la base de datos y verificar que existe
        let user = await User.findOne({ _id: id });
        if (!user) 
            return res.status(404).send({ message: 'User not found' });

        // Verificar que la contraseña anterior coincida con la almacenada en la base de datos
        if (!(await comparePassword(oldPassword, user.password))) 
            return res.status(401).send({ message: 'Incorrect old password' });

        // Actualizar la contraseña del usuario utilizando findOneAndUpdate
        let updatedUser = await User.findOneAndUpdate(
            { _id: id }, // Condición para encontrar el usuario por su ID y contraseña antigua
            { password: await encrypt(newPassword) }, // Actualizar la contraseña
            { new: true } // Devolver el usuario actualizado
        );

        if (!updatedUser) 
            return res.status(404).send({ message: 'User not found or password not updated' });

        return res.send({ message: 'Password updated successfully', updatedUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Error updating password', error: error });
    }
};