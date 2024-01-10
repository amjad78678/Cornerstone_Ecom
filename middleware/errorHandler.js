const errorHandler=(err,req,res,next)=>{
    console.log(err.message);
    res.status(err.status||404).render('404')
}

module.exports=errorHandler