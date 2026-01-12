const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  wishlist: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  viewHistory: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  purchaseHistory: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    purchasedAt: {
      type: Date,
      default: Date.now
    },
    quantity: {
      type: Number,
      default: 1
    }
  }]
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Method to add product to wishlist
userSchema.methods.addToWishlist = async function(productId) {
  if (!this.wishlist.includes(productId)) {
    this.wishlist.push(productId);
    await this.save();
  }
};

// Method to remove product from wishlist
userSchema.methods.removeFromWishlist = async function(productId) {
  this.wishlist = this.wishlist.filter(id => id.toString() !== productId.toString());
  await this.save();
};

// Method to add product to view history
userSchema.methods.addToViewHistory = async function(productId) {
  // Limit view history to last 100 items
  const existingIndex = this.viewHistory.findIndex(
    item => item.product.toString() === productId.toString()
  );
  
  if (existingIndex !== -1) {
    // Update the viewed time if already exists
    this.viewHistory[existingIndex].viewedAt = new Date();
  } else {
    this.viewHistory.unshift({ product: productId, viewedAt: new Date() });
    if (this.viewHistory.length > 100) {
      this.viewHistory = this.viewHistory.slice(0, 100);
    }
  }
  await this.save();
};

userSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  }
});

module.exports = mongoose.model('User', userSchema);
