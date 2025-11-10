// This file is: frontend/src/context/AuthContext.js

// ... (Rest of the file above) ...

// --- Register Function ---
const register = async (email, password, role, name) => {
  try {
    // 1. Create the user in Firebase Auth (on the frontend)
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const authUser = userCredential.user;

    // 2. Call our BACKEND API to save the user's role and data to Firestore

    //  ---- UPDATE THIS LINE ----
    const response = await fetch("http://192.168.1.3:5000/api/auth/register", {
      //  ---- UPDATE THE IP ADDRESS HERE to match your computer's IP ----

      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // Send the new user's details to the backend
      body: JSON.stringify({
        uid: authUser.uid, // The UID we got from creating the user in step 1
        email: email,
        role: role,
        name: name,
      }),
    });

    // If the backend response is not "ok" (e.g., status 400 or 500)
    if (!response.ok) {
      // Throw an error to stop the process
      throw new Error("Failed to save user role data to Firestore");
    }

    // 3. Set local state (the onAuthStateChanged listener will also catch this)
    //    This part is likely handled by your listener, but you could
    //    set state here as well if needed.
    // setUser(authUser);
    // setUserRole(role);
    // await AsyncStorage.setItem("userRole", role);
  } catch (error) {
    console.error("Registration Error:", error);
    throw error; // Throw the error so RegisterScreen.js can catch it and show an Alert
  }
};

// ... (Rest of the file below, like login, logout, etc.) ...
