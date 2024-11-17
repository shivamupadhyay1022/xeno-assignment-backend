const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const {User} = require("./models"); // Path to your User model

passport.use(
  new GoogleStrategy(
    {
      clientID: "913341075053-co9s1p7ti482seh6p886dg6imucj1f7m.apps.googleusercontent.com", // Replace with your Google Client ID
      clientSecret: "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", // Replace with your Google Client Secret
      callbackURL: "http://localhost:5000/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        const existingUser = await User.findOne({ email: profile.emails[0].value });
        if (existingUser) {
          return done(null, existingUser); // User exists
        }

        // If not, create a new user
        const newUser = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          password: "", // Google Auth users won't have a password
        });

        done(null, newUser);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// Serialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
