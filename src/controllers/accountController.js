import jwt from 'jsonwebtoken';

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
    // Pour la suite, on part du principe que password est déjà hash !
    const { username, password } = req.body;
    const user = req.app.locals.database.tables.get("users").find((user) => user.username === username);

    // On re-hash le mot de passe (avec sel cette fois) via l'entité user (comme à la création de compte)
    if (user && user.checkPassword(password)) {
        const token = createJWT(user);
        res.cookie("accessToken", token, { httpOnly: true });
        res.redirect("/");
    } else {
        res.render("login", { errorMessage: "Nom d'utilisateur/mot de passe incorrect." });
    }
}


// Appeler lorsque l'on clique sur "se déconnecter"
export function logout(req, res) {
    res.cookie("accessToken", null);
    res.clearCookie('accessToken');
    res.redirect("/");
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
