// Petit script pour activer le remplacement du champ de sélection de fichier par défaut

const fileInput = document.querySelector('#imageUpload');
const fileName = document.querySelector('.file-name');

const userIconPreview = document.getElementById('userIconPreview');
const ctx = userIconPreview.getContext('2d');

const MAX_WIDTH = 300; // Largeur maximale
const MAX_HEIGHT = 300; // Hauteur maximale

userIconPreview.width = MAX_WIDTH;
userIconPreview.height = MAX_HEIGHT;

// Initialiser la valeur du champ du nom de fichier lors du chargement de la page
fileName.textContent = fileInput.files.length > 0 ? fileInput.files[0].name : 'Aucun fichier sélectionné.';

// Changer le champ du nom de fichier à chaque chargement de fichier
fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];

    if (file) {
        fileName.textContent = file.name;

        const reader = new FileReader();
        reader.onload = (event) => {
            let img = new Image();
            img.onload = () => {
                // Calculer les nouvelles dimensions en conservant le ratio
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH || height > MAX_HEIGHT) {
                    if (width > height) {
                        height = (MAX_WIDTH / width) * height;
                        width = MAX_WIDTH;
                    } else {
                        width = (MAX_HEIGHT / height) * width;
                        height = MAX_HEIGHT;
                    }
                }

                // Redimensionner l'image sur le canvas
                userIconPreview.width = width;
                userIconPreview.height = height;
                ctx.clearRect(0, 0, userIconPreview.width, userIconPreview.height);
                ctx.drawImage(img, 0, 0, width, height);

                console.log(`Image redimensionnée à : ${width}x${height}px`);
            };

            img.src = event.target.result; // Charger l'image
        };

        reader.readAsDataURL(file); // Lire le fichier comme une URL de données
    } else {
        fileName.textContent = 'Aucun fichier sélectionné';
    }
});


