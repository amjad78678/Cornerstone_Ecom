
document.addEventListener("DOMContentLoaded", async () => {
    let addProducts = document.getElementById('addProductsPage')

    console.log('hello')
    console.log(addProducts)

    if (addProducts) {
        let inputImage = document.getElementById("image-input");
        let previewImageContainer = document.getElementById("image-preview");
        let cropButton = document.getElementById("crop-button");
        let croppers = [];
        let croppedDataArray = [];
        let croppedImagesContainer = document.getElementById("cropped-images");
        let submitForm = document.getElementById("submitForm");

        //product details

        let productName = document.getElementById("product_title");
        let productDesc = document.getElementById("product_description");
        let productPrice = document.getElementById("price");
        let productQty = document.getElementById("quantity");
        let productCategory = document.getElementById('category')
        let wood = document.getElementById("product_wood");



        croppedImagesContainer.innerHTML = ''

        inputImage.addEventListener("change", (event) => {
            console.log('File input changed');
            const files = event.target.files;
            console.log('Number of selected files:', files.length);
            console.log('Selected files:', files);

            if (files.length < 1 || files.length > 5) {
                inputImage.value = '';
                Swal.fire({
                    icon: 'warning',
                    title: 'Oops...',
                    text: 'You can only select up to 5 images!',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'OK'
                });

            }

            if (files.length > 0) {

                // Clear the existing preview images
                previewImageContainer.innerHTML = "";
                croppers.length = 0;

                for (let file of files) {
                    let reader = new FileReader();

                    reader.onload = (readEvent) => {
                        let image = new Image();
                        image.src = readEvent.target.result;

                        let preview = document.createElement("div");
                        preview.classList.add("view-image", "col-lg-6");
                        preview.appendChild(image);

                        previewImageContainer.appendChild(preview);

                        cropButton.disabled = false;

                        let cropper = new Cropper(image, {
                            viewMode: 1,
                        });

                        croppers.push(cropper);
                    };

                    reader.readAsDataURL(file);
                }
            }
        });
        cropButton.addEventListener("click", async () => {
            croppedImagesContainer.innerHTML = ''
            submitFormButton.disabled = false;
            croppedDataArray = [];
            for (let cropper of croppers) {
                let croppedCanvas = cropper.getCroppedCanvas();

                let blobPromise = new Promise((resolve) => {
                    croppedCanvas.toBlob((blob) => {
                        resolve(blob);
                    });
                });
                let blob = await blobPromise;

                croppedDataArray.push(blob);
                displayCroppedImage(croppedImagesContainer, blob);
            }
            console.log(croppedDataArray);

            inputImage.value = "";
        });

        function displayCroppedImage(targetDiv, blob) {
            console.log("display crop image");
            let img = document.createElement("img");
            img.src = URL.createObjectURL(blob);

            let previewCroppedImage = document.createElement("div");
            previewCroppedImage.classList.add("col-lg-6");
            previewCroppedImage.appendChild(img);

            targetDiv.appendChild(previewCroppedImage);
        }



        submitFormButton.addEventListener("click", async (event) => {
            console.log('button clicked')
            event.preventDefault();


            let productName = document.getElementById('product_title').value;
            let productDescription = document.getElementById('product_description').value.trim();
            let wood = document.getElementById('product_wood').value;
            let price = document.getElementById('price').value;
            let quantity = document.getElementById('quantity').value;
            let imageInput = document.getElementById('image-input');

            const nameRegex = /^[a-zA-Z\s]+$/;
            const descriptionRegex = /^[a-zA-Z0-9\s.,;:'"()?!-]+$/m
            const woodRegex = /^[a-zA-Z\s]+$/;
            const numericRegex = /^[0-9]+$/;

            if (!nameRegex.test(productName)) {
                document.getElementById('nameError').innerHTML = 'Name should only contain alphabets';
                return false;
            } else {
                document.getElementById('nameError').innerHTML = '';
            }

            if (!woodRegex.test(wood)) {
                document.getElementById('woodError').innerHTML = 'Wood should only contain alphabets';
                return false;
            } else {
                document.getElementById('woodError').innerHTML = '';
            }

            if (!numericRegex.test(price) || parseFloat(price) <= 0) {
                document.getElementById('priceError').innerHTML = 'Price should be a positive numeric value';
                return false;
            } else {
                document.getElementById('priceError').innerHTML = '';
            }

            if (!numericRegex.test(quantity) || parseInt(quantity) < 0) {
                document.getElementById('quantityError').innerHTML = 'Stock Quantity should be a non-negative integer';
                return false;
            } else {
                document.getElementById('quantityError').innerHTML = '';
            }


            // Create FormData
            let form = document.getElementById("productForm");
            let formData = new FormData(form);



            // Append images with different field names
            for (let i = 0; i < croppedDataArray.length; i++) {
                formData.append("image", croppedDataArray[i], `croppedImage_${i}.png`);
            }

            console.log(formData);

            // Check if the response is a redirect
            $.ajax({
                url: '/admin/editProduct',
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function (data) {
                    if (data.limited == true) {
                        document.getElementById('imageError').innerHTML = `${data.message}`

                    } else if (data.success === true) {
                        // Manually redirect to the specified location
                        window.location.href = '/admin/products';
                    } else {
                        // Handle other response scenarios if needed
                        console.error('Server response indicates failure:', data);
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    // Handle network errors or other exceptions
                    console.error('AJAX error:', textStatus, errorThrown);
                }
            });
        });





        productPrice.addEventListener('input', () => {
            console.log('enter num')
            let value = productPrice.value;
            value = value.replace(/^0+/, '');

            if (value.includes("-")) {
                value = value.replace('-', '');
            }
            productPrice.value = value;

        })

        productQty.addEventListener('input', () => {
            console.log('enter num')
            let value = productQty.value;
            value = value.replace(/^0+/, '');

            if (value.includes("-")) {
                value = value.replace('-', ''); 3
            }
            productQty.value = value;

        })
    } else {
        console.log("Not in add products")
    }



});