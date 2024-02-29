import Comment from './comment.model.js'
import User from '../user/user.model.js'
import Publi from '../publication/publi.model.js'
import jwt from 'jsonwebtoken'
import { checkUpdate } from '../../utils/validator.js'

export const add = async (req, res) => {
    try {
        let data = req.body
        let uid = req.user._id

        //let uid = req.user._id
        data.user = uid
        if(!data.publication || !data.comment || !data.user) return res.status(400).send({message: 'You must send all the parameters'})
        let comment = new Comment(data)
        await comment.save()
        return res.send({ message: 'add comment successfully' })
    } catch (err) {
        console.error(err)
        return res.status(500).send({ message: 'Error add comment', err: err })
    }
}

export const update = async (req, res) => {
    try {
        
        let data = req.body
        let uid = req.user._id
        let updated = checkUpdate(data, id)
        let comment = await Comment.findOne({ _id: id, user: uid });
        if (!comment) return res.status(404).send({ message: 'Comment not found or you are not authorized to updated it' });
        if (!updated) return res.status(400).send({ message: 'Have submitted some data that cannot be updated or missing data' })
        let updateComment = await Comment.findOneAndUpdate({_id: id}, data, {new: true})
        if (!updateComment) return res.status(401).send({ message: 'Comment not found and not updated' })
        return res.send({ message: 'Updated commet', updateComment })

    } catch (err) {
        console.error(err)
        return res.status(500).send({ message: 'Error updating comment' })
    }
}

export const deleted = async (req, res) => {
    try {
        let { id } = req.params;
        let uid = req.user._id


        // Verificar si la publicación existe y si el usuario es el propietario
        let comment = await Comment.findOne({ _id: id, user: uid });
        if (!comment)
            return res.status(404).send({ message: 'Comment not found or you are not authorized to delete it' });

        // Eliminar la publicación
        let updatedComment = await Comment.findOneAndDelete({ _id: id, user: uid });
        if (!updatedComment)
            return res.status(500).send({ message: 'Error deleting comment' });

        return res.send({ message: 'Comment deleted successfully' });
    } catch (err) {
        console.error(err);
        return res.status(500).send({ message: 'Error deleting comment' });
    }
}