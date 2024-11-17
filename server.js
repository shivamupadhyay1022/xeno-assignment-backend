const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const cors = require("cors");
const MongoStore = require("connect-mongo");
const session = require("express-session");
const { MongoClient, ServerApiVersion } = require("mongodb");
const { Customer, Order, User, CommunicationLog } = require("./models");
const uri = `mongodb+srv://clusturecrm:${encodeURIComponent(
  "crmpower@123"
)}@crm.xy5rh.mongodb.net/?retryWrites=true&w=majority&appName=crm`;
const axios = require("axios");
const port = 5000;
const app = express();
const router = express.Router();
const passport = require("./passportConfig");


//client id
//913341075053-co9s1p7ti482seh6p886dg6imucj1f7m.apps.googleusercontent.com
//secret
//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
// Middleware
app.use(bodyParser.json());
app.use(
  cors({
    origin: "http://localhost:5173", 
    credentials: true, 
  })
);
  app.use("/api/users", router);
// Connect to MongoDB Atlas
mongoose
  .connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Successfully connected to MongoDB!"))
  .catch((err) => console.error("MongoDB connection error:", err));




// Customer Registration Route (POST)
app.post("/api/customers", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({ message: "Customer already exists" });
    }

    // Create new customer
    const customer = new Customer({ name, email, password });
    await customer.save();
    res
      .status(201)
      .json({ message: "Customer created successfully", customer });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

//user registration

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }
  try {
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      id: new mongoose.Types.ObjectId().toString(),
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res
      .status(201)
      .json({ message: "User registered successfully", user: newUser });
  } catch (error) {
    console.error("Error during user registration:", error);
    res
      .status(500)
      .json({ message: "Error registering user", error: error.message });
  }
};
router.post("/register", registerUser);

// Default GET route
app.get("/", (req, res) => {
  res
    .status(200)
    .json({ message: "Welcome to the CRM & Campaign Management API" });
});

// Session middlware configuration
app.use(
  session({
    secret: "your_secret_key", // Replace with a secure secret key
    resave: false,
    saveUninitialized: true,
  })
);


app.use(passport.initialize());
app.use(passport.session());

// Login Route
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Save user data in the session
    req.session.user = { id: user._id, email: user.email };

    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Logout Route
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ message: "Could not log out." });
    }
    res.clearCookie("connect.sid"); // Clear session cookie
    res.status(200).json({ message: "Logged out successfully." });
  });
});

//get user by id
const getUserById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching user", error: error.message });
  }
};

router.get("/get-user/:id", getUserById);

// Check Session Route
router.get("/check-session", (req, res) => {
  try {
    if (req.session.User) {
      try {
        res.status(200).json({ loggedIn: true, user: req.session.user });
      } catch (error) {
        console.log(error);
      }
    } else {
      res.status(200).json({ loggedIn: false });
    }
  } catch (error) {
    console.error("Error in /check-session:", error);
    res.status(500).json({ message: "Internal Server Error", error });
  }
});

// Order Creation Route (POST)
app.post("/api/orders", async (req, res) => {
  const { customerId, orderDetails, totalAmount } = req.body;

  try {
    const order = new Order({ customerId, orderDetails, totalAmount });
    await order.save();
    res.status(201).json({ message: "Order created successfully", order });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


//audience set
app.post("/api/audiences", async (req, res) => {
  const { userId, audience } = req.body;
  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // console.log("Audience data received:", audience); 

    user.audiences.push({
      ...audience,
      id: new mongoose.Types.ObjectId().toString(),
    });
    await user.save();
    res.status(201).json({ message: "Audience created successfully", user });
  } catch (error) {
    console.error("Error creating audience:", error, audience); // Log detailed error
    res.status(500).json({ error: error.message });
  }
});

//Update audience set
app.put("/api/audiences/:audienceId", async (req, res) => {
  const { userId, audienceId } = req.params;
  const updatedData = req.body;

  try {
    const user = await User.findById(userId);
    const audience = user.audiences.id(audienceId);
    Object.assign(audience, updatedData);
    await user.save();
    res.status(200).json({ message: "Audience updated successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Delete audience set
app.delete("/api/audiences/:audienceId", async (req, res) => {
  const { userId, audienceId } = req.params;

  try {
    const user = await User.findById(userId);
    user.audiences.id(audienceId).remove();
    await user.save();
    res.status(200).json({ message: "Audience deleted successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Get audience set by id
app.get("/api/audiences-id", async (req, res) => {
  const { userId, audienceId } = req.query;

  try {
    if (!userId || !audienceId) {
      return res
        .status(400)
        .json({ message: "userId and audienceId are required" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const audienceSet =
      user.audiences.id(audienceId) ||
      user.audiences.find((aud) => aud.id === audienceId);
    if (!audienceSet) {
      res.status(404).json({ message: "Audience set does not exist" });
    }
    res
      .status(200)
      .json({ message: "Audience deleted successfully", audienceSet });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Get all the audienece set
app.get("/api/audiences/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email });
    console.log(user);
    if (!user) {
      res.status(404).json({ message: "User Not Found" });
    } else 
    res.status(200).json(user.audiences);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Create campaign set
app.post("/api/campaigns", async (req, res) => {
  const { userId, campaign } = req.body;

  try {
    const user = await User.findById(userId);
    
    if(!userId || !campaign){
      return res.status(400).json({ message : "user id and campaign required"})
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.campaigns.push({
      ...campaign,
      id: new mongoose.Types.ObjectId().toString(),
    });

    await user.save();
    res.status(201).json({ message: "Campaign created successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Update campaign set
app.put("/api/campaigns/:campaignId", async (req, res) => {
  const { userId, campaignId } = req.params;
  const updatedData = req.body;

  try {
    const user = await User.findById(userId);
    const campaign = user.campaigns.id(campaignId);
    Object.assign(campaign, updatedData);
    await user.save();
    res.status(200).json({ message: "Campaign updated successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Delete campaign set
app.delete("/api/campaigns/:campaignId", async (req, res) => {
  const { userId, campaignId } = req.params;

  try {
    const user = await User.findById(userId);
    user.campaigns.id(campaignId).remove();
    await user.save();
    res.status(200).json({ message: "Campaign deleted successfully", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Get all campaign sets
app.get("/api/campaigns/:email", async (req, res) => {
  const { email } = req.params;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: "User Not Found" });
    } else res.status(200).json(user.campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Send Messages
app.post("/api/send-messages", async (req, res) => {
  const {userId, audienceId, messageTemplate } = req.body;

  try {
    // Fetch audience from the database

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const audienceSet =
      user.audiences.id(audienceId) ||
      user.audiences.find((aud) => aud.id === audienceId);
    if (!audienceSet) {
      res.status(404).json({ message: "Audience set does not exist" });
    }
    

    // Create a new communication log
    const log = new CommunicationLog({
      audienceId :audienceId,
      messages: audienceSet.conditions.map((cond) => ({
        recipient: cond.field, // Use the appropriate field for recipient
        status: "PENDING",
      })),
    });

    await log.save();

    // Simulateing sending messages
    for (const message of log.messages) {
      const personalizedMessage = messageTemplate.replace("[Name]", message.recipient);
      const status = Math.random() < 0.9 ? "SENT" : "FAILED";

      // Calling the delivery receipt API
      await axios.post("http://localhost:5000/api/delivery-receipt", {
        logId: log._id,
        recipient: message.recipient,
        status,
      });
    }

    res.status(200).json({ message: "Messages sent", logId: log._id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Delivery Receipt Api
app.post("/api/delivery-receipt", async (req, res) => {
  const { logId, recipient, status } = req.body;

  try {
    const log = await CommunicationLog.findById(logId);
    if (!log) {
      return res.status(404).json({ message: "Communication log not found" });
    }

    // Updating the status of the specific recipient
    const message = log.messages.find((msg) => msg.recipient === recipient);
    if (!message) {
      return res.status(404).json({ message: "Recipient not found in log" });
    }

    message.status = status;

    await log.save();

    res.status(200).json({ message: "Delivery status updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("http://localhost:5173/dashboard"); // Redirect to a dashboard or any secure page
  }
);

app.get("/logout", (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect("/"); // Redirect to the home page after logout
  });
});

