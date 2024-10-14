import jwt from 'jsonwebtoken';
import { encryptPassword } from "../utils/index.js";

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


// Crée un compte utilisateur avec les informations du formulaire
export function createAccount(req, res) {
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
        req.app.locals.database.tables.get("users").create(newUser);
        req.app.locals.database.load(); // Met à jour la base locale au cas où

        // Créer un token JWT
        const token = createJWT(newUser);

        // Défini le token dans le cookie et redirige
        res.cookie("accessToken", token, { httpOnly: true });
        res.redirect("/");
    }
}


// Appeler après validation du formulaire de connexion
export function login(req, res) {
    const { username, password } = req.body;
    const user = req.app.locals.database.tables.get("users").find((user) => user.username === username);

    // On re-hash le mot de passe (avec sel cette fois) via l'entité user (comme à la création de compte)
    if (user && user.checkPassword(password)) {
        const token = createJWT(user);
        res.cookie("accessToken", token, { httpOnly: true });
        res.redirect("/");
    } else {
        res.render("login", { username: username, errorMessage: "Nom d'utilisateur/mot de passe incorrect." });
    }
}


// Appeler lorsque l'on clique sur "se déconnecter"
export function logout(req, res) {
    res.cookie("accessToken", null);
    res.clearCookie('accessToken');
    res.redirect("/");
}


// Modifie un compte utilisateur avec les informations du formulaire
export function editAccount(req, res) {
    // On récupère les nouvelles informations envoyées par l'utilisateur
    const { email, username, password } = req.body;

    // On récupère l'utilisateur connecté
    const localUser = res.locals.user;
    // On cherche cet utilisateur dans la base de données
    const users = req.app.locals.database.tables.get("users").getAll();
    const user = req.app.locals.database.tables.get("users").find((user) => user.email === localUser.email);
    // console.log("LocalUser? ", !!localUser);
    // console.log("User? ", !!user);
    
    // Vérifie si le nouveau pseudo est déjà existant
    const usernameAlreadyTaken = users.find(u => u.username === username && u.username !== localUser.username);
    const emailAlreadyTaken = users.find(u => u.email === email && u.email !== localUser.email)

    // On empêche bien sûr de changer de pseudo ou de mail pour un déjà existant
    if (usernameAlreadyTaken) {
        return res.render("account", { usernameTaken: "Ce nom d'utilisateur est déjà pris.", email: email, username: username });
    } else if (emailAlreadyTaken) {
        return res.render("account", { emailTaken: "Un compte existe déjà pour cette adresse mail.", email: email, username: username });
    } else {
        // J'ai bien vu la fonction user.update(data), mais je pense pas pouvoir l'utiliser ici
        var userIsUpdated = false;

        var newUser = {
            email: user.email,
            username: user.username,
            password: user.password,
            updatedAt: Date.now()
        };

        // const newUser = user;
        if (email !== user.email) {
            newUser.email = email;
            userIsUpdated = true;
        }
        if (username !== user.username) {
            newUser.username = username;
            userIsUpdated = true;
        }
        if (password !== "" && !user.checkPassword(password)) {
            newUser.password = encryptPassword(password, user.salt);
            userIsUpdated = true;
        }

        // console.log("Update ? ", userIsUpdated);

        // Effectue les modifications de l'utilisateur dans la base
        if (userIsUpdated) {
            // user.update(newUser);
            console.log(user);

            try {
                user.update(newUser); // Ça fonctionne au niveau bdd, mais ça renvoie une erreur serveur et donc au client aussi
                
                //Toujours la même erreur:
                /*
                    file:///C:/Users/nicol/OneDrive/Documents/Semestre%207/ACL/Projet/ACL-2024-KiAvenir/src/structures/Entity.js:233
                        for (const row of updated[1]) {
                                                ^
                    TypeError: updated[1] is not iterable
                        at UsersEntity.update (file:///C:/Users/nicol/OneDrive/Documents/Semestre%207/ACL/Projet/ACL-2024-KiAvenir/src/structures/Entity.js:233:30)
                */

                req.app.locals.database.load(); // Met à jour la base locale au cas où
            } catch {
                res.redirect("/");
            }
            // req.
        }

        // Créer un token JWT
        const token = createJWT(user);

        // Défini le token dans le cookie et redirige
        res.cookie("accessToken", token, { httpOnly: true });
        res.redirect("/");
    }
}


// Supprime le compte (de l'utilisateur connecté) de la base de données
export function deleteAccount(req, res) {
    const localUser = res.locals.user;
    const user = req.app.locals.database.tables.get("users").find((user) => user.username === localUser.username);

    try {
        user.delete(); // Supprime l'utilisateur de la base de données
        req.app.locals.database.load(); // Met à jour la base de données locale (sinon on pourrait toujours se connecter sur un compte supprimé jusqu'au redémarrage du serveur)
        logout(req, res);
    } catch {
        res.render("account", { errorMessage: "Erreur: impossible de supprimer le compte." });
    }
}
