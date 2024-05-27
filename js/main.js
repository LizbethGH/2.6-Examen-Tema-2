// Obtener referencia al canvas
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Definir dimensiones del canvas
const window_height = 700; // Altura del lienzo
const window_width = 1000; // Anchura del lienzo

// Establecer dimensiones del canvas
canvas.height = window_height;
canvas.width = window_width;

// Declaración de variables para las imágenes y sonidos
const backgroundImage = new Image();
backgroundImage.src = 'Espacio.png';

const bubbleImage = new Image();
bubbleImage.src = 'Meteorito.webp';

const newBubbleImage = new Image();
newBubbleImage.src = 'Asteroide.webp';

const clickSound = new Audio('click.mp3'); // Especifica la ruta de tu sonido de clic

// Cambiar el cursor cuando el ratón entra en el lienzo
canvas.addEventListener("mouseenter", () => {
    canvas.style.cursor = "url('Cohete.png') 16 16, auto"; // Especifica las coordenadas del hotspot del cursor
});

// Restaurar el cursor cuando el ratón sale del lienzo
canvas.addEventListener("mouseleave", () => {
    canvas.style.cursor = "auto";
});

// Declaración de variables para la puntuación y nivel
let score = 0;
let level = 1;
let timeToNextLevel = 15000; // 15 segundos
let lastTime = Date.now();
const scoreElement = document.getElementById("score");
const highScoreElement = document.getElementById("highScore");
const levelElement = document.getElementById("level");

// Obtener la puntuación más alta de localStorage
let highScore = localStorage.getItem("highScore") || 0;
highScoreElement.innerText = `Puntuación más alta: ${highScore}`;

// Variables para el temporizador
let startTime = Date.now();
let gameRunning = true;

// Clase Circle para representar los objetos en el juego
class Circle {
    constructor(x, y, radius, text, image) {
        this.posX = x;
        this.posY = y;
        this.radius = radius;
        this.text = text;
        this.speed = 1; // Velocidad inicial fija a 1
        this.dx = (Math.random() - 0.5) * 2 * this.speed; // Dirección horizontal aleatoria (-1 o 1) multiplicada por la velocidad
        this.dy = -Math.random() * this.speed; // Dirección vertical hacia arriba con velocidad aleatoria
        this.visible = true;
        this.image = image; // Asignar la imagen específica para este círculo
    }

    draw() {
        if (!this.visible) return;

        // Dibujar la imagen del círculo
        ctx.drawImage(this.image, this.posX - this.radius, this.posY - this.radius, this.radius * 2, this.radius * 2);

        // Dibujar el número en el centro del círculo
        ctx.fillStyle = "#fff"; // Color blanco para el número
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "20px Arial";
        ctx.fillText(this.text, this.posX, this.posY);
    }

    update(circles) {
        if (!this.visible) return;

        this.draw();

        this.posX += this.dx; // Mover en el eje X
        this.posY += this.dy; // Mover en el eje Y

        // Rebotar en los bordes laterales
        if (this.posX + this.radius >= window_width || this.posX - this.radius <= 0) {
            this.dx = -this.dx; // Invertir la dirección horizontal al chocar con los bordes laterales
        }

        // Rebotar con otros círculos y ajustar posición para evitar solapamiento
        for (let otherCircle of circles) {
            if (this !== otherCircle && otherCircle.visible) {
                let distance = getDistance(this.posX, otherCircle.posX, this.posY, otherCircle.posY);
                if (distance < this.radius + otherCircle.radius) {
                    let angle = Math.atan2(otherCircle.posY - this.posY, otherCircle.posX - this.posX);
                    let overlap = this.radius + otherCircle.radius - distance + 1;

                    // Calcular nuevos componentes de velocidad después del choque
                    let u1 = this.dx;
                    let v1 = this.dy;
                    let u2 = otherCircle.dx;
                    let v2 = otherCircle.dy;

                    // Intercambiar velocidades después del choque (rebote elástico)
                    this.dx = u2;
                    this.dy = v2;
                    otherCircle.dx = u1;
                    otherCircle.dy = v1;

                    // Mover los círculos para evitar solapamiento
                    this.posX -= overlap * Math.cos(angle);
                    this.posY -= overlap * Math.sin(angle);
                    otherCircle.posX += overlap * Math.cos(angle);
                    otherCircle.posY += overlap * Math.sin(angle);
                }
            }
        }

        // Desaparecer al llegar al borde superior
        if (this.posY - this.radius <= 0) {
            this.visible = false;
        }
    }

    containsPoint(x, y) {
        // Utilizar la fórmula del teorema de Pitágoras (distancia al cuadrado) para determinar si el punto (x, y) está dentro del círculo
        let dx = x - this.posX;
        let dy = y - this.posY;
        return dx * dx + dy * dy <= this.radius * this.radius;
    }

    increaseSpeed(level) {
        this.dx *= (level + 1); // Incrementar la velocidad horizontal según el nivel
        this.dy *= (level + 1); // Incrementar la velocidad vertical según el nivel
    }
}

// Función para calcular la distancia entre dos puntos
function getDistance(x1, x2, y1, y2) {
    let xDistance = x2 - x1;
    let yDistance = y2 - y1;
    return Math.sqrt(xDistance * xDistance + yDistance * yDistance);
}

// Array para almacenar los círculos
let circles = [];

// Función para crear círculos
function createCircles(image) {
    let newCircles = [];
    for (let i = 0; i < 20; i++) {
        let radius = Math.random() * 50 + 20; // Radio entre 20 y 70
        let x = Math.random() * (window_width - radius * 2) + radius;
        let y = window_height + radius + i * 50; // Posición debajo de la pantalla, incrementando el espacio vertical
        let text = (i + 1).toString(); // Números del 1 al 20

        let circle = new Circle(x, y, radius, "", image);
        newCircles.push(circle);
    }
    return newCircles;
}

// Crear círculos con la primera imagen
circles = circles.concat(createCircles(bubbleImage));

// Crear círculos con la segunda imagen
circles = circles.concat(createCircles(newBubbleImage));

// Listener para el evento de clic
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Verificar si se hizo clic en un círculo visible y aumentar la puntuación
    for (let circle of circles) {
        if (circle.containsPoint(mouseX, mouseY) && circle.visible) {
            circle.visible = false;
            clickSound.play();
            score += 10; // Incrementar la puntuación en 10
            scoreElement.innerText = `Puntuación: ${score}`;
            break;
        }
    }
});

// Evento para terminar el juego cuando el cursor toca un círculo
canvas.addEventListener("mousemove", (event) => {
    if (!gameRunning) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    for (let circle of circles) {
        if (circle.containsPoint(mouseX, mouseY) && circle.visible) {
            gameRunning = false;
            let elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1);
            alert(`¡Juego terminado! Puntuación: ${elapsedTime} segundos`);
            return;
        }
    }
});

// Función para actualizar el juego
function updateGame() {
    if (!gameRunning) return;

    // Dibujar el fondo
    ctx.drawImage(backgroundImage, 0, 0, window_width, window_height);

    let currentTime = Date.now();
    let elapsedTime = ((currentTime - startTime) / 1000).toFixed(1);
    scoreElement.innerText = `Puntuación: ${elapsedTime} segundos`;

    if (currentTime - lastTime > timeToNextLevel) {
        level++;
        levelElement.innerText = `Nivel: ${level}`;
        for (let circle of circles) {
            circle.increaseSpeed(level);
        }
        lastTime = currentTime;
    }

    // Actualizar y dibujar los círculos
    for (let circle of circles) {
        circle.update(circles);
    }

    // Actualizar la puntuación más alta
    if (elapsedTime > highScore) {
        highScore = elapsedTime;
        localStorage.setItem("highScore", highScore);
        highScoreElement.innerText = `Puntuación más alta: ${highScore}`;
    }

    // Solicitar una nueva animación
    requestAnimationFrame(updateGame);
}

// Reproducir el audio de fondo
const backgroundAudio = document.getElementById("backgroundAudio");
backgroundAudio.play();
backgroundAudio.volume = 0.5; // Ajustar el volumen
backgroundAudio.loop = true;

// Evento que se dispara cuando la imagen de fondo se carga completamente
backgroundImage.onload = () => {
    // Iniciar el juego después de cargar la imagen de fondo
    updateGame();
};
