import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';


function createJWT(user) {
    const payload = {
        id: user.id,
        email: user.email,
        username: user.username
    };

    // Sign the token with a secret key
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}

export function createAccount(req, res) {
    // Pour la suite, on part du principe que password est déjà hash !
    // console.log(req.body); // Les infos du formulaire envoyé (email, username, password)
    
    const { email, username, password } = req.body;

    // Récupère les utilisateurs de la base de données
    const users = req.app.locals.database.tables.get("users").getAll();
    console.log(users);
    const usernameAlreadyTaken = users.find(u => u.username === username)
    const emailAlreadyTaken = users.find(u => u.email === email)

    if (usernameAlreadyTaken) {
        return res.status(400).send("Ce nom d'utilisateur est déjà pris.");
    } else if (emailAlreadyTaken) {
        return res.status(400).send("Un compte existe déjà pour cette adresse mail.");
    } else {
        const createdAt = Date.now();
        const updatedAt = createdAt;

        const newUser = {
            email,
            username,
            password,
            createdAt,
            updatedAt
        };

        // Ajoute l'utilisateur à la base
        req.app.locals.database.tables.get("users").create(newUser)

        // Créer un token JWT
        const token = createJWT(newUser);

        // Défini le token dans le cookie et redirige
        res.cookie("accessToken", token, { httpOnly: true });
        res.redirect("/");
    }
}

export function authenticate(req, res, next) {
    console.log("Cookies:", req.cookies);  // Debug log to check if cookies are populated
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            console.log("PAS DE TOKEN TROUVÉ");
            res.locals.user = null;
            return next();
        }
        const user = jwt.verify(token, process.env.SECRET);
        console.log("ON ESSAIE D'AUTHENTIFIER L'UTILISATEUR " + user.email);
        res.locals.user = user;
    } catch (error) {
        console.log("Aucun token d'accès trouvé dans le cookie pour authentifier le client");
        
        // Compte de test pour tester l'affichage
        res.locals.user = {
            email: "jb@kiavenir.fr",
            username: "Jean-Baptiste"
        }
        // console.error("Authentication failed:", error);
        // res.status(401).send("Unauthorized");
    }
    next();
}

export function login(req, res) {
    // Pour la suite, on part du principe que password est déjà hash !
    const { username, password } = req.body;
    const user = req.app.locals.database.tables.get("users").find((user) => user.username === username);

    // if (user && user.password === createHash("sha256").update(password).digest("hex")) { 
    if (user && user.password === password) {
        const token = createJWT(user);
        res.cookie("accessToken", token, { httpOnly: true });
        res.redirect("/");
    } else {
        // console.log(user.password + "\n" + password);
        res.render("login", { message: "Nom d'utilisateur/mot de passe invalide." });
    }
    // console.log(res);
    
    // console.log(user);
}

export function logout(req, res) {
    res.cookie("accessToken", null);
    res.redirect("/");
}