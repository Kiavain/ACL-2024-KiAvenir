import jwt from 'jsonwebtoken';

export function createAccount(res, req) {
    // ! Pour la suite, on part du principe que password est déjà hash !

    console.log(res);
    console.log(req);
    console.log(req.body);
    console.log("juste avant erreur");
    const { username, password } = req.body;

    // Récupère les utilisateurs de la base de données
    const users = this.app.database.tables.get("users").getAll();
    const user = users.find(u => u.username === username && u.checkPassword(password))

    if (user) {
        return res.status(400).send("Ce nom d'utilisateur est déjà pris.");
    } else {
        const newUser = {
            username,
            password,
        };

        // Ajoute l'utilisateur à la base
        this.server.database.tables.get("users").create(newUser)

        // Créer un token JWT
        const token = createJWT(newUser);

        // Défini le token dans le cookie et redirige
        res.cookie("accessToken", token, { httpOnly: true });
        res.redirect("/");
    }
}

export function authenticate(req, res, next) {
    try {
        const token = req.cookies.accessToken;
        const user = jwt.verify(token, process.env.SECRET);
        res.locals.user = user;
    } catch (error) {
        console.error("Authentication failed:", error);
        res.status(401).send("Unauthorized");
    }
    next();
}
