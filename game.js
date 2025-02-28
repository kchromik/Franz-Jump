// Franz Jump - Ein 2D Jump and Run Spiel mit einem Dackel

// Warten bis das DOM geladen ist
document.addEventListener('DOMContentLoaded', () => {
    // Canvas und Kontext einrichten
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Spielparameter
    let gameRunning = false;
    let score = 0;
    let highScore = localStorage.getItem('franzJumpHighScore') || 0;
    let animationFrameId = null;
    
    // Canvas-Größe festlegen
    canvas.width = 800;
    canvas.height = 400;
    
    // Spielelemente
    let franz = {
        x: 50,
        y: canvas.height - 70,
        width: 70,
        height: 40,
        speed: 8,         // Erhöht von 5 auf 8
        jumpPower: 15,    // Erhöht von 12 auf 15
        velocityY: 0,
        jumping: false,
        grounded: true,
        direction: 'right'
    };
    
    // Bilder laden
    const franzRightImg = new Image();
    const franzLeftImg = new Image();
    const backgroundImg = new Image();
    
    franzRightImg.src = 'images/franz_right.png';
    franzLeftImg.src = 'images/franz_left.png';
    backgroundImg.src = 'images/background.png';
    
    // Vorübergehend Franz als Rechteck zeichnen, falls Bilder nicht geladen sind
    function drawFranz() {
        // Körper
        ctx.fillStyle = '#8B4513';  // Braun für den Dackel
        ctx.fillRect(franz.x, franz.y, franz.width, franz.height);
        
        // Augen
        ctx.fillStyle = 'white';
        if (franz.direction === 'right') {
            ctx.fillRect(franz.x + 50, franz.y + 8, 12, 12);
            ctx.fillStyle = 'black';
            ctx.fillRect(franz.x + 55, franz.y + 10, 5, 5);
        } else {
            ctx.fillRect(franz.x + 8, franz.y + 8, 12, 12);
            ctx.fillStyle = 'black';
            ctx.fillRect(franz.x + 10, franz.y + 10, 5, 5);
        }
        
        // Schnauze
        ctx.fillStyle = '#5D4037';
        if (franz.direction === 'right') {
            ctx.fillRect(franz.x + 65, franz.y + 15, 10, 15);
            ctx.fillStyle = 'black';
            ctx.fillRect(franz.x + 70, franz.y + 25, 5, 5);
        } else {
            ctx.fillRect(franz.x - 5, franz.y + 15, 10, 15);
            ctx.fillStyle = 'black';
            ctx.fillRect(franz.x, franz.y + 25, 5, 5);
        }
        
        // Ohren
        ctx.fillStyle = '#6D4C41';
        if (franz.direction === 'right') {
            ctx.fillRect(franz.x + 45, franz.y - 10, 15, 15);
        } else {
            ctx.fillRect(franz.x + 10, franz.y - 10, 15, 15);
        }
        
        // Schwanz
        ctx.fillStyle = '#8B4513';
        if (franz.direction === 'right') {
            ctx.fillRect(franz.x - 5, franz.y + 10, 10, 10);
        } else {
            ctx.fillRect(franz.x + 65, franz.y + 10, 10, 10);
        }
    }
    
    // Hindernisse
    let obstacles = [];
    
    function createObstacle() {
        const height = 20 + Math.random() * 50;
        obstacles.push({
            x: canvas.width,
            y: canvas.height - height,
            width: 30,
            height: height,
            passed: false
        });
    }
    
    // Plattformen
    let platforms = [
        { x: 0, y: canvas.height - 30, width: canvas.width, height: 30 } // Boden
    ];
    
    function createPlatform() {
        const width = 80 + Math.random() * 120;
        const x = canvas.width;
        const y = 100 + Math.random() * 200;
        
        platforms.push({
            x: x,
            y: y,
            width: width,
            height: 20,
            passed: false
        });
    }
    
    // Kollisionserkennung
    function checkCollision(obj1, obj2) {
        return (
            obj1.x < obj2.x + obj2.width &&
            obj1.x + obj1.width > obj2.x &&
            obj1.y < obj2.y + obj2.height &&
            obj1.y + obj1.height > obj2.y
        );
    }
    
    // Tasten-Status
    const keys = {};
    window.addEventListener('keydown', (e) => {
        keys[e.key] = true;
    });
    window.addEventListener('keyup', (e) => {
        keys[e.key] = false;
    });
    
    // Spiellogik aktualisieren
    function update() {
        if (!gameRunning) return;
        
        // Franz bewegen
        if (keys['ArrowLeft']) {
            franz.x -= franz.speed;
            franz.direction = 'left';
        }
        if (keys['ArrowRight']) {
            franz.x += franz.speed;
            franz.direction = 'right';
        }
        
        // Franz springen lassen
        if (keys['ArrowUp'] && franz.grounded) {
            franz.velocityY = -franz.jumpPower;
            franz.grounded = false;
            franz.jumping = true;
        }
        
        // Schwerkraft anwenden
        franz.velocityY += 0.5;  // Reduziert von 0.6 auf 0.5 für langsameren Fall
        franz.y += franz.velocityY;
        franz.grounded = false;
        
        // Kollision mit Plattformen prüfen
        platforms.forEach(platform => {
            if (
                franz.x + franz.width > platform.x &&
                franz.x < platform.x + platform.width &&
                franz.y + franz.height > platform.y &&
                franz.y + franz.height < platform.y + platform.height + franz.velocityY
            ) {
                franz.grounded = true;
                franz.jumping = false;
                franz.velocityY = 0;
                franz.y = platform.y - franz.height;
                
                if (!platform.passed && platform !== platforms[0]) {
                    platform.passed = true;
                    score++;
                    updateScore();
                }
            }
        });
        
        // Hindernisse bewegen und Kollision prüfen
        for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].x -= 3.5;  // Erhöht von 3 auf 3.5
            
            // Kollision mit Hindernis
            if (checkCollision(franz, obstacles[i])) {
                gameOver();
                return;
            }
            
            // Hindernis aus Array entfernen, wenn es den Bildschirm verlässt
            if (obstacles[i].x + obstacles[i].width < 0) {
                obstacles.splice(i, 1);
            }
        }
        
        // Plattformen bewegen
        for (let i = platforms.length - 1; i >= 0; i--) {
            if (i === 0) continue; // Boden nicht bewegen
            
            platforms[i].x -= 3.5;  // Erhöht von 2 auf 3.5
            
            // Plattform aus Array entfernen, wenn sie den Bildschirm verlässt
            if (platforms[i].x + platforms[i].width < 0) {
                platforms.splice(i, 1);
            }
        }
        
        // Neue Hindernisse und Plattformen erstellen
        if (Math.random() < 0.01) {
            createObstacle();
        }
        
        if (Math.random() < 0.02) {
            createPlatform();
        }
        
        // Spielfeldgrenzen
        if (franz.x < 0) franz.x = 0;
        if (franz.x + franz.width > canvas.width) franz.x = canvas.width - franz.width;
        
        // Spieler ist aus dem Bildschirm gefallen
        if (franz.y > canvas.height) {
            gameOver();
            return;
        }
        
        // Spielfeld zeichnen
        draw();
        
        // Game Loop fortsetzen
        animationFrameId = requestAnimationFrame(update);
    }
    
    // Spielfeld zeichnen
    function draw() {
        // Hintergrund löschen
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Hintergrundbild
        // ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
        
        // Hintergrund als Farbverlauf
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#87CEEB');  // Himmelblau oben
        gradient.addColorStop(1, '#e0f7fa');  // Hellblau unten
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Wolken zeichnen
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(100, 80, 30, 0, Math.PI * 2);
        ctx.arc(130, 70, 40, 0, Math.PI * 2);
        ctx.arc(160, 80, 30, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(500, 100, 30, 0, Math.PI * 2);
        ctx.arc(530, 90, 40, 0, Math.PI * 2);
        ctx.arc(560, 100, 30, 0, Math.PI * 2);
        ctx.fill();
        
        // Plattformen zeichnen
        ctx.fillStyle = '#4CAF50';  // Grün für Plattformen
        platforms.forEach(platform => {
            ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
            
            // Gras auf den Plattformen
            ctx.fillStyle = '#81C784';
            ctx.fillRect(platform.x, platform.y, platform.width, 5);
        });
        
        // Hindernisse zeichnen
        ctx.fillStyle = '#FF6347';  // Rot für Hindernisse
        obstacles.forEach(obstacle => {
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            
            // Details für Hindernisse
            ctx.fillStyle = '#E53935';
            ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, obstacle.height - 10);
        });
        
        // Franz zeichnen
        drawFranz();
        
        // Score auf dem Canvas anzeigen
        ctx.font = '20px Arial';
        ctx.fillStyle = 'black';
        ctx.textAlign = 'left';
        ctx.fillText(`Punkte: ${score}`, 20, 30);
    }
    
    // Punktestand aktualisieren
    function updateScore() {
        document.getElementById('score').textContent = score;
        document.getElementById('highscore').textContent = highScore;
    }
    
    // Spiel starten
    function startGame() {
        if (gameRunning) return;
        
        // Bisherigen Animation Frame canceln (falls vorhanden)
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        gameRunning = true;
        score = 0;
        updateScore();
        
        // Franz zurücksetzen
        franz.x = 50;
        franz.y = canvas.height - 70;
        franz.velocityY = 0;
        franz.grounded = true;
        
        // Hindernisse und Plattformen (außer Boden) zurücksetzen
        obstacles = [];
        platforms = [
            { x: 0, y: canvas.height - 30, width: canvas.width, height: 30 } // Boden beibehalten
        ];
        
        // Game Loop starten
        animationFrameId = requestAnimationFrame(update);
        
        // Button-Text ändern
        document.getElementById('startButton').innerHTML = '<i class="fas fa-redo"></i> Neustarten';
    }
    
    // Spiel beenden
    function gameOver() {
        gameRunning = false;
        
        // Animation stoppen
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        
        // Highscore aktualisieren
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('franzJumpHighScore', highScore);
            document.getElementById('highscore').textContent = highScore;
        }
        
        // Game Over Nachricht anzeigen
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.font = '36px "Fredoka One", cursive';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 40);
        
        ctx.font = '24px "Nunito", sans-serif';
        ctx.fillText(`Punkte: ${score}`, canvas.width / 2, canvas.height / 2);
        ctx.fillText(`Highscore: ${highScore}`, canvas.width / 2, canvas.height / 2 + 30);
        ctx.fillText('Klicke auf "Neustarten" um erneut zu spielen', canvas.width / 2, canvas.height / 2 + 70);
        
        // Button-Text zurücksetzen
        document.getElementById('startButton').innerHTML = '<i class="fas fa-play"></i> Spiel starten';
    }
    
    // Event-Listener für Start-Button
    document.getElementById('startButton').addEventListener('click', startGame);
    
    // Sound-Steuerung
    const muteButton = document.getElementById('muteButton');
    let muted = localStorage.getItem('franzJumpMuted') === 'true';
    
    function updateMuteButton() {
        muteButton.innerHTML = muted 
            ? '<i class="fas fa-volume-mute"></i>' 
            : '<i class="fas fa-volume-up"></i>';
    }
    
    muteButton.addEventListener('click', () => {
        muted = !muted;
        localStorage.setItem('franzJumpMuted', muted);
        updateMuteButton();
    });
    
    updateMuteButton();
    
    // Erstes Zeichnen des Spielfelds
    draw();
    
    // Initialen Gamestate anzeigen
    ctx.font = '40px "Fredoka One", cursive';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('Franz Jump', canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.font = '24px "Nunito", sans-serif';
    ctx.fillText('Drücke den "Spiel starten" Button um zu beginnen', canvas.width / 2, canvas.height / 2 + 20);
    
    // Highscore initialisieren
    updateScore();
});
