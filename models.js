const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Customer Schema
const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// Hash password before saving
customerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Order Schema
const orderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  orderDetails: { type: String, required: true },
  totalAmount: { type: Number, required: true }
});

const Customer = mongoose.model('Customer', customerSchema);
const Order = mongoose.model('Order', orderSchema);


const UserSchema = new mongoose.Schema({
  id: { type: String, unique: true, default: () => new mongoose.Types.ObjectId().toString() },
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, },
  audiences: [
    {
      id: { type: String, unique: true, required: true },
      name: { type: String},
      description: { type: String },
      conditions: [
        {
          field: { type: String, required: true },
          operator: { type: String},
          value: { type: mongoose.Schema.Types.Mixed, required: true },
        },
      ],
      logic: { type: String },
      calculatedSize: { type: Number },
    },
  ],
  campaigns: [
    {
      id: { type: String, unique: true, required: true },
      name: { type: String, required: true },
      audienceId: { type: String, required: true },
      budget: { type: Number, required: true },
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
    },
  ],
});

const CommunicationLogSchema = new mongoose.Schema({
  audienceId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Audience" },
  messages: [
    {
      recipient: { type: String, required: true }, // e.g., name or contact identifier
      status: { type: String },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

const CommunicationLog = mongoose.model("CommunicationLog", CommunicationLogSchema);

const User = mongoose.model('User', UserSchema);

module.exports = { Customer, Order,User, CommunicationLog };
