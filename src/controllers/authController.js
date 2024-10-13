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
    // console.log(users);
    const usernameAlreadyTaken = users.find(u => u.username === username)
    const emailAlreadyTaken = users.find(u => u.email === email)

    if (usernameAlreadyTaken) {
        // return res.status(400).send("Ce nom d'utilisateur est déjà pris.");
        return res.render("signin", { usernameTaken: "Ce nom d'utilisateur est déjà pris.", email: email, username: username });
    } else if (emailAlreadyTaken) {
        // return res.status(400).send("Un compte existe déjà pour cette adresse mail.");
        return res.render("signin", { emailTaken: "Un compte existe déjà pour cette adresse mail.", email: email, username: username });
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
        // console.log("Les cookies créés: ", res.cookies);
        res.redirect("/");
    }
}


// Fonction pour lire les cookies
function parseCookies (request) {
    const list = {};
    const cookieHeader = request.headers?.cookie;
    if (!cookieHeader) return list;

    cookieHeader.split(`;`).forEach(function(cookie) {
        let [ name, ...rest] = cookie.split(`=`);
        name = name?.trim();
        if (!name) return;
        const value = rest.join(`=`).trim();
        if (!value) return;
        list[name] = decodeURIComponent(value);
    });

    return list;
}

export function authenticate(req, res, next) {
    // Lecture des cookies
    const cookies = parseCookies(req);
    // console.log("On a trouvé les cookies: ", cookies);
    // console.log("cookies.accessToken: ", cookies.accessToken, !cookies.accessToken);

    try {
        const token = cookies.accessToken;
        if (!token) {
            console.log("PAS DE TOKEN TROUVÉ");
            res.locals.user = null;
            return next();
        }
        const user = jwt.verify(token, process.env.JWT_SECRET);
        // console.log("On a authentifié l'utilisateur " + user.username);
        res.locals.user = user;
    } catch (error) {
        console.log("Aucun token d'accès trouvé dans le cookie:", error);
        
        // Compte de test pour tester l'affichage
        // res.locals.user = {
        //     email: "jb@kiavenir.fr",
        //     username: "Jean-Baptiste"
        // }

        // console.error("Authentication failed:", error);
        // res.status(401).send("Unauthorized");
    }
    next();
}

export function login(req, res) {
    // Pour la suite, on part du principe que password est déjà hash !
    const { username, password } = req.body;
    const user = req.app.locals.database.tables.get("users").find((user) => user.username === username);

    // désactiver pour l'instant, parce que la on hashait 2 fois le mot de passe, donc à voir si on passe le mot de passe pas hashé avec la page de connexion
    // if (user && user.password === createHash("sha256").update(password).digest("hex")) { 
    if (user && user.password === password) {
        const token = createJWT(user);
        res.cookie("accessToken", token, { httpOnly: true });
        // console.log("Les cookies créés: ", res.cookies); // on ne peut pas y accéder avec res.cookies (voir fonction authenticate)
        res.redirect("/");
    } else {
        // console.log(user.password + "\n" + password);
        res.render("login", { message: "Nom d'utilisateur/mot de passe invalide." });
    }
}

export function logout(req, res) {
    res.cookie("accessToken", null);
    res.clearCookie('accessToken');
    res.redirect("/");
}