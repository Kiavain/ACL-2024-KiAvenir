import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';


// Fonction pour créer un token
function createJWT(user) {
    const payload = {
        id: user.id,
        email: user.email,
        username: user.username
    };

    // Signe le token avec une clé secrète
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
}


// Fonction pour lire les cookies
function parseCookies(request) {
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

// Utilisée à chaque chargement de page, cherche à authentifier l'utilisateur via son token (dans un cookie)
export function authenticate(req, res, next) {
    // Lecture des cookies
    const cookies = parseCookies(req);

    try {
        const token = cookies.accessToken;
        if (!token) {
            res.locals.user = null;
            return next();
        }
        const user = jwt.verify(token, process.env.JWT_SECRET);
        res.locals.user = user; // On a authentifié l'utilisateur
    } catch (error) {
        console.log("Erreur: aucun token d'accès trouvé dans le cookie\n", error);
        // res.status(401).send("Unauthorized");
    }
    next();
}

// Pour créer un compte utilisateur
export function createAccount(req, res) {
    // Pour la suite, on part du principe que password est déjà hash !

    const { email, username, password } = req.body;

    // Récupère les utilisateurs de la base de données
    const users = req.app.locals.database.tables.get("users").getAll();
    const usernameAlreadyTaken = users.find(u => u.username === username)
    const emailAlreadyTaken = users.find(u => u.email === email)

    if (usernameAlreadyTaken) {
        return res.render("signin", { usernameTaken: "Ce nom d'utilisateur est déjà pris.", email: email, username: username });
    } else if (emailAlreadyTaken) {
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
        res.redirect("/");
    }
}


export function login(req, res) {
    // Pour la suite, on part du principe que password est déjà hash !
    const { username, password } = req.body;
    const user = req.app.locals.database.tables.get("users").find((user) => user.username === username);

    // Désactivé pour l'instant, parce que là on hashait 2 fois le mot de passe, donc à voir si on passerait plutôt le mot de passe pas hashé avec la page de connexion
    // if (user && user.password === createHash("sha256").update(password).digest("hex")) { 
    if (user && user.password === password) {
        const token = createJWT(user);
        res.cookie("accessToken", token, { httpOnly: true });
        res.redirect("/");
    } else {
        res.render("login", { message: "Nom d'utilisateur/mot de passe invalide." });
    }
}

export function logout(req, res) {
    res.cookie("accessToken", null);
    res.clearCookie('accessToken');
    res.redirect("/");
}


export function deleteAccount(req, res) {
    //todo

    // On finira quoi qu'il arrive par ça (si le compte est bien supprimé)
    logout(req, res);
}