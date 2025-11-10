const admin = require("firebase-admin");

// User Register Function
const registerUser = async (req, res) => {
  // 1. Get email and password from the request body
  const { email, password, name, phone } = req.body;

  // Basic validation
  if (!email || !password || !name || !phone) {
    return res
      .status(400)
      .send({ message: "Email, password, name, and phone are required." });
  }

  try {
    // 2. Create the user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: name,
      phoneNumber: phone, // Make sure phone number is in E.164 format (e.g., +94712345678)
    });

    // 3. (Optional but recommended) Save other details (like name, phone) to Firestore
    //    We can add this later. For now, we just create the auth user.

    // 4. Send success response
    res.status(201).send({
      message: "User created successfully!",
      uid: userRecord.uid,
    });
  } catch (error) {
    // 5. Handle errors
    console.error("Error creating new user:", error);
    res.status(400).send({
      message: "Error creating user",
      error: error.message,
    });
  }
};

// Export the function so 'routes' can use it
module.exports = {
  registerUser,
};
