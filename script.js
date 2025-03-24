document.addEventListener('DOMContentLoaded', () => {
    const board = document.getElementById('board');
    const turnDisplay = document.getElementById('current-turn');
    const resetButton = document.getElementById('reset-btn');
    const capturedWhiteContainer = document.getElementById('captured-white');
    const capturedBlackContainer = document.getElementById('captured-black');
    
    let selectedCell = null;
    let currentTurn = 'white';
    let capturedPieces = {
        white: [],
        black: []
    };
    
    // Initialiser les pièces
    const initialBoardState = [
        ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜'],
        ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['', '', '', '', '', '', '', ''],
        ['♟', '♟', '♟', '♟', '♟', '♟', '♟', '♟'],
        ['♜', '♞', '♝', '♛', '♚', '♝', '♞', '♜']
    ];
    
    // État du jeu
    let gameState = {
        board: JSON.parse(JSON.stringify(initialBoardState)),
        castlingRights: {
            white: { kingSide: true, queenSide: true },
            black: { kingSide: true, queenSide: true }
        },
        kingPositions: {
            white: { row: 7, col: 4 },
            black: { row: 0, col: 4 }
        },
        inCheck: {
            white: false,
            black: false
        },
        moveHistory: []
    };
    
    // Créer l'échiquier
    function createBoard() {
        board.innerHTML = '';
        
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.classList.add((row + col) % 2 === 0 ? 'white' : 'black');
                
                // Ajouter les coordonnées
                const fileCoord = document.createElement('span');
                fileCoord.classList.add('coord', 'file');
                fileCoord.textContent = String.fromCharCode(97 + col);
                if (row === 7) cell.appendChild(fileCoord);
                
                const rankCoord = document.createElement('span');
                rankCoord.classList.add('coord', 'rank');
                rankCoord.textContent = 8 - row;
                if (col === 0) cell.appendChild(rankCoord);
                
                // Ajouter la pièce si présente
                const piece = gameState.board[row][col];
                if (piece) {
                    const pieceElement = document.createElement('div');
                    pieceElement.classList.add('piece');
                    
                    // Ajouter la classe de couleur appropriée
                    const pieceColor = getPieceColor(piece);
                    if (pieceColor === 'white') {
                        pieceElement.classList.add('white-piece');
                    } else {
                        pieceElement.classList.add('black-piece');
                    }
                    
                    // Ajouter le type de pièce comme classe et comme contenu
                    const pieceType = getPieceType(piece);
                    pieceElement.classList.add(pieceType);
                    pieceElement.textContent = piece;
                    
                    cell.appendChild(pieceElement);
                }
                
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', handleCellClick);
                
                board.appendChild(cell);
            }
        }
        
        // Mettre à jour l'affichage des pièces capturées
        updateCapturedPieces();
    }
    
    // Réinitialiser le jeu
    function resetGame() {
        gameState = {
            board: JSON.parse(JSON.stringify(initialBoardState)),
            castlingRights: {
                white: { kingSide: true, queenSide: true },
                black: { kingSide: true, queenSide: true }
            },
            kingPositions: {
                white: { row: 7, col: 4 },
                black: { row: 0, col: 4 }
            },
            inCheck: {
                white: false,
                black: false
            },
            moveHistory: []
        };
        
        currentTurn = 'white';
        selectedCell = null;
        capturedPieces = {
            white: [],
            black: []
        };
        
        turnDisplay.textContent = 'Blancs';
        createBoard();
    }
    
    // Déterminer la couleur d'une pièce
    function getPieceColor(piece) {
        if (!piece) return null;
        
        const whitePieces = ['♙', '♖', '♘', '♗', '♕', '♔'];
        return whitePieces.includes(piece) ? 'white' : 'black';
    }
    
    // Déterminer le type d'une pièce
    function getPieceType(piece) {
        const pieceTypes = {
            '♙': 'pawn', '♟': 'pawn',
            '♖': 'rook', '♜': 'rook',
            '♘': 'knight', '♞': 'knight',
            '♗': 'bishop', '♝': 'bishop',
            '♕': 'queen', '♛': 'queen',
            '♔': 'king', '♚': 'king'
        };
        
        return pieceTypes[piece] || null;
    }
    
    // Obtenir les mouvements valides pour une pièce
    function getValidMoves(row, col) {
        const piece = gameState.board[row][col];
        const pieceColor = getPieceColor(piece);
        const pieceType = getPieceType(piece);
        
        if (!piece || pieceColor !== currentTurn) {
            return [];
        }
        
        let moves = [];
        
        switch (pieceType) {
            case 'pawn':
                moves = getPawnMoves(row, col, pieceColor);
                break;
            case 'rook':
                moves = getRookMoves(row, col, pieceColor);
                break;
            case 'knight':
                moves = getKnightMoves(row, col, pieceColor);
                break;
            case 'bishop':
                moves = getBishopMoves(row, col, pieceColor);
                break;
            case 'queen':
                moves = getQueenMoves(row, col, pieceColor);
                break;
            case 'king':
                moves = getKingMoves(row, col, pieceColor);
                break;
        }
        
        // Filtrer les mouvements qui mettraient le roi en échec
        moves = moves.filter(move => {
            const tempBoard = JSON.parse(JSON.stringify(gameState.board));
            const capturedPiece = tempBoard[move.row][move.col];
            tempBoard[move.row][move.col] = tempBoard[row][col];
            tempBoard[row][col] = '';
            
            const kingRow = pieceType === 'king' ? move.row : gameState.kingPositions[pieceColor].row;
            const kingCol = pieceType === 'king' ? move.col : gameState.kingPositions[pieceColor].col;
            
            return !isInCheck(kingRow, kingCol, pieceColor, tempBoard);
        });
        
        return moves;
    }
    
    // Obtenir les mouvements des pions
    function getPawnMoves(row, col, color) {
        const moves = [];
        const direction = color === 'white' ? -1 : 1;
        const startRow = color === 'white' ? 6 : 1;
        
        // Avancer d'une case
        if (row + direction >= 0 && row + direction < 8 && !gameState.board[row + direction][col]) {
            moves.push({ row: row + direction, col });
            
            // Avancer de deux cases depuis la position initiale
            if (row === startRow && !gameState.board[row + 2 * direction][col]) {
                moves.push({ row: row + 2 * direction, col });
            }
        }
        
        // Captures en diagonale
        const captureDirections = [{ row: direction, col: -1 }, { row: direction, col: 1 }];
        
        for (const dir of captureDirections) {
            const newRow = row + dir.row;
            const newCol = col + dir.col;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = gameState.board[newRow][newCol];
                
                if (targetPiece && getPieceColor(targetPiece) !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
        
        return moves;
    }
    
    // Obtenir les mouvements de la tour
    function getRookMoves(row, col, color) {
        return getStraightMoves(row, col, color);
    }
    
    // Obtenir les mouvements du cavalier
    function getKnightMoves(row, col, color) {
        const moves = [];
        const directions = [
            { row: -2, col: -1 }, { row: -2, col: 1 },
            { row: -1, col: -2 }, { row: -1, col: 2 },
            { row: 1, col: -2 }, { row: 1, col: 2 },
            { row: 2, col: -1 }, { row: 2, col: 1 }
        ];
        
        for (const dir of directions) {
            const newRow = row + dir.row;
            const newCol = col + dir.col;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = gameState.board[newRow][newCol];
                
                if (!targetPiece || getPieceColor(targetPiece) !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
        
        return moves;
    }
    
    // Obtenir les mouvements du fou
    function getBishopMoves(row, col, color) {
        return getDiagonalMoves(row, col, color);
    }
    
    // Obtenir les mouvements de la reine
    function getQueenMoves(row, col, color) {
        return [...getStraightMoves(row, col, color), ...getDiagonalMoves(row, col, color)];
    }
    
    // Obtenir les mouvements du roi
    function getKingMoves(row, col, color) {
        const moves = [];
        const directions = [
            { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
            { row: 0, col: -1 }, { row: 0, col: 1 },
            { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 }
        ];
        
        for (const dir of directions) {
            const newRow = row + dir.row;
            const newCol = col + dir.col;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = gameState.board[newRow][newCol];
                
                if (!targetPiece || getPieceColor(targetPiece) !== color) {
                    moves.push({ row: newRow, col: newCol });
                }
            }
        }
        
        // Roque
        if (gameState.castlingRights[color].kingSide && canCastle(row, col, color, 'king')) {
            moves.push({ row, col: col + 2, castling: 'king' });
        }
        
        if (gameState.castlingRights[color].queenSide && canCastle(row, col, color, 'queen')) {
            moves.push({ row, col: col - 2, castling: 'queen' });
        }
        
        return moves;
    }
    
    // Vérifier si le roque est possible
    function canCastle(row, col, color, side) {
        // Vérifier que le roi n'est pas en échec
        if (isInCheck(row, col, color, gameState.board)) {
            return false;
        }
        
        const kingRow = color === 'white' ? 7 : 0;
        
        // Vérifier que le roi est à sa position initiale
        if (row !== kingRow || col !== 4) {
            return false;
        }
        
        if (side === 'king') {
            // Vérifier que les cases entre le roi et la tour sont vides
            if (gameState.board[kingRow][5] || gameState.board[kingRow][6]) {
                return false;
            }
            
            // Vérifier que la tour est à sa position initiale
            if (!gameState.board[kingRow][7] || getPieceType(gameState.board[kingRow][7]) !== 'rook') {
                return false;
            }
            
            // Vérifier que les cases que le roi traverse ne sont pas sous attaque
            if (isSquareAttacked(kingRow, 5, color, gameState.board) || isSquareAttacked(kingRow, 6, color, gameState.board)) {
                return false;
            }
        } else if (side === 'queen') {
            // Vérifier que les cases entre le roi et la tour sont vides
            if (gameState.board[kingRow][1] || gameState.board[kingRow][2] || gameState.board[kingRow][3]) {
                return false;
            }
            
            // Vérifier que la tour est à sa position initiale
            if (!gameState.board[kingRow][0] || getPieceType(gameState.board[kingRow][0]) !== 'rook') {
                return false;
            }
            
            // Vérifier que les cases que le roi traverse ne sont pas sous attaque
            if (isSquareAttacked(kingRow, 2, color, gameState.board) || isSquareAttacked(kingRow, 3, color, gameState.board)) {
                return false;
            }
        }
        
        return true;
    }
    
    // Vérifier si une case est attaquée
    function isSquareAttacked(row, col, color, board) {
        const opponentColor = color === 'white' ? 'black' : 'white';
        
        // Vérifier les attaques de pions
        const pawnDirections = color === 'white' ? [{ row: -1, col: -1 }, { row: -1, col: 1 }] : [{ row: 1, col: -1 }, { row: 1, col: 1 }];
        
        for (const dir of pawnDirections) {
            const newRow = row + dir.row;
            const newCol = col + dir.col;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const piece = board[newRow][newCol];
                
                if (piece && getPieceColor(piece) === opponentColor && getPieceType(piece) === 'pawn') {
                    return true;
                }
            }
        }
        
        // Vérifier les attaques de cavaliers
        const knightDirections = [
            { row: -2, col: -1 }, { row: -2, col: 1 },
            { row: -1, col: -2 }, { row: -1, col: 2 },
            { row: 1, col: -2 }, { row: 1, col: 2 },
            { row: 2, col: -1 }, { row: 2, col: 1 }
        ];
        
        for (const dir of knightDirections) {
            const newRow = row + dir.row;
            const newCol = col + dir.col;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const piece = board[newRow][newCol];
                
                if (piece && getPieceColor(piece) === opponentColor && getPieceType(piece) === 'knight') {
                    return true;
                }
            }
        }
        
        // Vérifier les attaques en ligne droite (tour, reine)
        const straightDirections = [
            { row: -1, col: 0 }, { row: 1, col: 0 },
            { row: 0, col: -1 }, { row: 0, col: 1 }
        ];
        
        for (const dir of straightDirections) {
            let newRow = row + dir.row;
            let newCol = col + dir.col;
            
            while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const piece = board[newRow][newCol];
                
                if (piece) {
                    if (getPieceColor(piece) === opponentColor && (getPieceType(piece) === 'rook' || getPieceType(piece) === 'queen')) {
                        return true;
                    }
                    break; // Une pièce bloque la ligne
                }
                
                newRow += dir.row;
                newCol += dir.col;
            }
        }
        
        // Vérifier les attaques en diagonale (fou, reine)
        const diagonalDirections = [
            { row: -1, col: -1 }, { row: -1, col: 1 },
            { row: 1, col: -1 }, { row: 1, col: 1 }
        ];
        
        for (const dir of diagonalDirections) {
            let newRow = row + dir.row;
            let newCol = col + dir.col;
            
            while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const piece = board[newRow][newCol];
                
                if (piece) {
                    if (getPieceColor(piece) === opponentColor && (getPieceType(piece) === 'bishop' || getPieceType(piece) === 'queen')) {
                        return true;
                    }
                    break; // Une pièce bloque la diagonale
                }
                
                newRow += dir.row;
                newCol += dir.col;
            }
        }
        
        // Vérifier les attaques du roi
        const kingDirections = [
            { row: -1, col: -1 }, { row: -1, col: 0 }, { row: -1, col: 1 },
            { row: 0, col: -1 }, { row: 0, col: 1 },
            { row: 1, col: -1 }, { row: 1, col: 0 }, { row: 1, col: 1 }
        ];
        
        for (const dir of kingDirections) {
            const newRow = row + dir.row;
            const newCol = col + dir.col;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const piece = board[newRow][newCol];
                
                if (piece && getPieceColor(piece) === opponentColor && getPieceType(piece) === 'king') {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // Vérifier si un roi est en échec
    function isInCheck(kingRow, kingCol, color, board) {
        return isSquareAttacked(kingRow, kingCol, color, board);
    }
    
    // Obtenir les mouvements en ligne droite (tour, reine)
    function getStraightMoves(row, col, color) {
        const moves = [];
        const directions = [
            { row: -1, col: 0 }, { row: 1, col: 0 },
            { row: 0, col: -1 }, { row: 0, col: 1 }
        ];
        
        for (const dir of directions) {
            let newRow = row + dir.row;
            let newCol = col + dir.col;
            
            while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = gameState.board[newRow][newCol];
                
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (getPieceColor(targetPiece) !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break; // Une pièce bloque la ligne
                }
                
                newRow += dir.row;
                newCol += dir.col;
            }
        }
        
        return moves;
    }
    
    // Obtenir les mouvements en diagonale (fou, reine)
    function getDiagonalMoves(row, col, color) {
        const moves = [];
        const directions = [
            { row: -1, col: -1 }, { row: -1, col: 1 },
            { row: 1, col: -1 }, { row: 1, col: 1 }
        ];
        
        for (const dir of directions) {
            let newRow = row + dir.row;
            let newCol = col + dir.col;
            
            while (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                const targetPiece = gameState.board[newRow][newCol];
                
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol });
                } else {
                    if (getPieceColor(targetPiece) !== color) {
                        moves.push({ row: newRow, col: newCol });
                    }
                    break; // Une pièce bloque la diagonale
                }
                
                newRow += dir.row;
                newCol += dir.col;
            }
        }
        
        return moves;
    }
    
    // Gestion du clic sur une cellule
    function handleCellClick(event) {
        const cell = event.currentTarget;
        const row = parseInt(cell.dataset.row);
        const col = parseInt(cell.dataset.col);
        
        // Si aucune cellule n'est sélectionnée
        if (!selectedCell) {
            const piece = gameState.board[row][col];
            
            if (piece && getPieceColor(piece) === currentTurn) {
                selectedCell = { row, col };
                cell.classList.add('selected');
                
                // Afficher les mouvements valides
                const validMoves = getValidMoves(row, col);
                
                for (const move of validMoves) {
                    const targetCell = document.querySelector(`.cell[data-row="${move.row}"][data-col="${move.col}"]`);
                    targetCell.classList.add('valid-move');
                }
            }
        } else {
            // Si une cellule est déjà sélectionnée
            const validMoves = getValidMoves(selectedCell.row, selectedCell.col);
            const isValidMove = validMoves.some(move => move.row === row && move.col === col);
            
            // Annuler la sélection si on clique sur la même cellule
            if (selectedCell.row === row && selectedCell.col === col) {
                clearSelection();
                return;
            }
            
            // Si le mouvement est valide
            if (isValidMove) {
                const piece = gameState.board[selectedCell.row][selectedCell.col];
                const pieceType = getPieceType(piece);
                const targetPiece = gameState.board[row][col];
                
                // Capturer une pièce adverse
                if (targetPiece) {
                    const targetColor = getPieceColor(targetPiece);
                    capturedPieces[targetColor].push(targetPiece);
                }
                
                // Effectuer le mouvement
                gameState.board[row][col] = piece;
                gameState.board[selectedCell.row][selectedCell.col] = '';
                
                // Mettre à jour la position du roi si c'est le roi qui bouge
                if (pieceType === 'king') {
                    gameState.kingPositions[currentTurn] = { row, col };
                    
                    // Mettre à jour les droits de roque
                    gameState.castlingRights[currentTurn].kingSide = false;
                    gameState.castlingRights[currentTurn].queenSide = false;
                    
                    // Gérer le roque
                    const move = validMoves.find(m => m.row === row && m.col === col);
                    if (move && move.castling) {
                        if (move.castling === 'king') {
                            // Déplacer la tour du petit roque
                            gameState.board[row][col - 1] = gameState.board[row][col + 1];
                            gameState.board[row][col + 1] = '';
                        } else if (move.castling === 'queen') {
                            // Déplacer la tour du grand roque
                            gameState.board[row][col + 1] = gameState.board[row][col - 2];
                            gameState.board[row][col - 2] = '';
                        }
                    }
                }
                
                // Mettre à jour les droits de roque pour les tours
                if (pieceType === 'rook') {
                    if (selectedCell.row === (currentTurn === 'white' ? 7 : 0)) {
                        if (selectedCell.col === 0) {
                            gameState.castlingRights[currentTurn].queenSide = false;
                        } else if (selectedCell.col === 7) {
                            gameState.castlingRights[currentTurn].kingSide = false;
                        }
                    }
                }
                
                // Promotion du pion
                if (pieceType === 'pawn' && (row === 0 || row === 7)) {
                    // Promouvoir automatiquement en dame pour simplifier
                    gameState.board[row][col] = currentTurn === 'white' ? '♕' : '♛';
                }
                
                // Changer de tour
                currentTurn = currentTurn === 'white' ? 'black' : 'white';
                turnDisplay.textContent = currentTurn === 'white' ? 'Blancs' : 'Noirs';
                
                // Vérifier si le roi est en échec
                const kingPos = gameState.kingPositions[currentTurn];
                gameState.inCheck[currentTurn] = isInCheck(kingPos.row, kingPos.col, currentTurn, gameState.board);
                
                // Vérifier si le roi est en échec et mat
                if (gameState.inCheck[currentTurn]) {
                    const isCheckmate = isInCheckmate(currentTurn);
                    if (isCheckmate) {
                        setTimeout(() => {
                            alert(`Échec et mat ! Les ${currentTurn === 'white' ? 'Noirs' : 'Blancs'} ont gagné !`);
                        }, 100);
                    }
                }
                
                // Mettre à jour l'affichage
                createBoard();
            } else {
                // Si le mouvement n'est pas valide, annuler la sélection
                clearSelection();
            }
        }
    }
    
    // Effacer la sélection
    function clearSelection() {
        selectedCell = null;
        
        const selectedCells = document.querySelectorAll('.cell.selected');
        selectedCells.forEach(cell => {
            cell.classList.remove('selected');
        });
        
        const validMoveCells = document.querySelectorAll('.cell.valid-move');
        validMoveCells.forEach(cell => {
            cell.classList.remove('valid-move');
        });
    }
    
    // Mettre à jour l'affichage des pièces capturées
    function updateCapturedPieces() {
        capturedWhiteContainer.innerHTML = '';
        capturedBlackContainer.innerHTML = '';
        
        capturedPieces.white.forEach(piece => {
            const pieceElement = document.createElement('div');
            pieceElement.classList.add('piece', 'white-piece');
            pieceElement.classList.add(getPieceType(piece));
            pieceElement.textContent = piece;
            capturedWhiteContainer.appendChild(pieceElement);
        });
        
        capturedPieces.black.forEach(piece => {
            const pieceElement = document.createElement('div');
            pieceElement.classList.add('piece', 'black-piece');
            pieceElement.classList.add(getPieceType(piece));
            pieceElement.textContent = piece;
            capturedBlackContainer.appendChild(pieceElement);
        });
    }
    
    // Vérifier si un roi est en échec et mat
    function isInCheckmate(color) {
        // Vérifier s'il y a au moins un mouvement valide pour n'importe quelle pièce
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = gameState.board[row][col];
                
                if (piece && getPieceColor(piece) === color) {
                    const moves = getValidMoves(row, col);
                    
                    if (moves.length > 0) {
                        return false;
                    }
                }
            }
        }
        
        return true;
    }
    
    // Initialiser le jeu
    resetButton.addEventListener('click', resetGame);
    resetGame();
});