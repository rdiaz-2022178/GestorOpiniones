import Category from './category.model.js'


export const add = async (req, res) => {
    try {
        let data = req.body
        let existingCategory = await Category.findOne({ name: data.name });
        if (existingCategory) {
            return res.status(400).send({ message: 'Category with this name already exists' });
        }
        if (!data.name || !data.description) return res.status(400).send({ message: 'You must send all the parameters' })


        let category = new Category(data)
        await category.save()
        return res.send({ message: 'a new category was created' })
    } catch (error) {
        console.error(error)
        return res.status(500).send({ message: 'saving erro' })
    }
}