const loadProductList = async (req, res) => {
    try {
        const { userId } = req.session
        let { searchInput, minPrice, maxPrice, selectedCateg, pageno } = req.body;

        if (searchInput || minPrice || maxPrice || selectedCateg || pageno) {
            if (searchInput) {
                let isSearch = await Product.find({
                    name: { $regex: searchInput, $options: 'i' },
                });

                if (isSearch.length > 0) {
                    req.session.searchInput = searchInput;
                }
            }

            if (minPrice && maxPrice) {
                let productsInRange = await Product.find({
                    price: { $gte: minPrice, $lte: maxPrice },
                });


                if (productsInRange.length > 0) {
                    req.session.minPrice = minPrice;
                    req.session.maxPrice = maxPrice;
                }
            }
            if (selectedCateg == 'All') {
                const allProduct = await Product.find({})
                if (allProduct.length > 0) {
                    req.session.allProduct = true
                }

            } else {

                const selectedCat = await Product.find({ category: selectedCateg })
                console.log(selectedCat);
                if (selectedCat.length > 0) {
                    req.session.selectedCategory = selectedCateg
                    req.session.allProduct = false
                }
            }

            if (pageno) {
                req.session.pageno = pageno
            }


            return res.json({ success: true });
        } else {
            let condition = {};


            if (req.session.searchInput) {
                condition.name = {
                    $regex: req.session.searchInput,
                    $options: 'i',
                };
                delete req.session.searchInput;
            }


            if (req.session.minPrice !== undefined && req.session.maxPrice !== undefined) {
                condition.price = {
                    $gte: req.session.minPrice,
                    $lte: req.session.maxPrice,
                };
                delete req.session.minPrice;
                delete req.session.maxPrice;
            }
            if (req.session.selectedCategory) {
                // If there's a category filter, apply it
                condition.category = req.session.selectedCategory;
                delete req.session.selectedCategory
            } else if (req.session.allProduct) {
                delete req.session.allProduct
            }


            let page = 1; // Default to page 1
            let skip = 0;

            if (req.session.pageno) {
                page = req.session.pageno;
                skip = (page - 1) * 6;
                console.log('Page:', page);
                console.log('Calculated skip:', skip);
                delete req.session.pageno;
            }

            let product = [];

            if (condition.name || condition.price || condition.category) {
                // If there's a search or price condition, apply it to all products
                product = await Product.find(condition).skip(skip).limit(6).populate({ path: 'offer', match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } } }).populate({ path: 'categoryId', populate: { path: 'offer', match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } } } })
            } else {
                // If no filters are specified, get all products
                product = await Product.find({}).skip(skip).limit(6).populate({ path: 'offer', match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } } }).populate({ path: 'categoryId', populate: { path: 'offer', match: { startingDate: { $lte: new Date() }, expiryDate: { $gte: new Date() } } } })
            }


            const productsCount = await Product.find(condition).count()

            let totalPages = Math.ceil(productsCount / 6)
            const count = await Product.find(condition).count()
            const currentPage = 'productList'





            const category = await Category.find({});

            // const  category= await Category.find({})
            let userData = await User.findOne({ _id: req.session.userId })
            res.render('productList', { userId, user: userData, category: category, product: product, userId, currentPage, count, productsCount, totalPages })

        }


    } catch (error) {
        console.log(error.message);
        res.status(500).render('serverError', { message: error.message });
    }
}
