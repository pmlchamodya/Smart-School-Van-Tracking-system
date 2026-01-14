const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// Define the User Schema (Structure of the user data in the database)
const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    role: {
      type: String,
      enum: ["admin", "driver", "parent"],
      default: "parent",
    },
    // For Drivers only: Store van details
    vanDetails: {
      type: Object,
      required: false,
    },
    // For Parents only: Link to student profiles
    children: [
      {
        studentName: String,
        studentId: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Middleware: Encrypt password before saving to the database
userSchema.pre("save", async function () {
  // If password is not modified, skip encryption
  if (!this.isModified("password")) {
    return;
  }

  // Generate a salt and hash the password
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method: Verify entered password with the hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
