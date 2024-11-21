const iconPath = "/img/user_icon/1.jpg"; //todo: recuperer l'id utilisateur (par exemple dans un datatype chéplukoi)

fetch(iconPath, { method: 'HEAD' })
  .then((response) => {
    if (response.ok) {
        // console.log(`${iconPath} existe.`);
        document.getElementById("userIcon").src = iconPath;
    } else {
        console.log(`${iconPath} n'existe pas.`);
    }
  })
  .catch(() => {
    console.log(`Erreur lors du chargement de l'image utilisateur.`);
});