const pkg = require("multer-storage-cloudinary");
console.log("Type of pkg:", typeof pkg);
console.log("pkg keys:", Object.keys(pkg));
if (pkg.CloudinaryStorage) {
    console.log("Type of CloudinaryStorage:", typeof pkg.CloudinaryStorage);
} else {
    console.log("CloudinaryStorage is missing from exports");
}
console.log("pkg itself constructor?", typeof pkg === 'function');
