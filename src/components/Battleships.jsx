import React, { useState, useEffect, useCallback } from 'react';
import './Battleships.css';

// Typy lodí a jejich tvary
const SHIP_TYPES = {
    SUBMARINE: { name: 'Ponorka', size: 1, shape: [[1]] },
    DESTROYER: { name: 'Torpédoborec', size: 2, shape: [[1, 1]] },
    CRUISER: { name: 'Křižník', size: 3, shape: [[1, 1, 1]] },
    BATTLESHIP: { name: 'Bitevní loď', size: 4, shape: [[1, 1, 1, 1]] },
    CARRIER: {
        name: 'Letadlová loď',
        size: 9,
        shape: [
            [0, 0, 1, 0, 0],
            [1, 1, 1, 1, 1],
            [0, 0, 0, 0, 0]
        ]
    }
};

// Konfigurace obtížnosti
const DIFFICULTY_CONFIGS = {
    '6x6': { size: 6, ships: { SUBMARINE: 3, DESTROYER: 2, CRUISER: 1, BATTLESHIP: 0, CARRIER: 0 } },
    '9x9': { size: 9, ships: { SUBMARINE: 4, DESTROYER: 3, CRUISER: 1, BATTLESHIP: 1, CARRIER: 0 } },
    '12x12': { size: 12, ships: { SUBMARINE: 5, DESTROYER: 3, CRUISER: 2, BATTLESHIP: 1, CARRIER: 1 } },
    '15x15': { size: 15, ships: { SUBMARINE: 7, DESTROYER: 4, CRUISER: 3, BATTLESHIP: 2, CARRIER: 1 } }
};

// Hlavní komponenta aplikace
const BattleShips = () => {
    const [gameMode, setGameMode] = useState('menu'); // menu, game, competitive, competitiveSetup, editor, stats
    const [gameState, setGameState] = useState(null);
    const [playerStats, setPlayerStats] = useState({});
    const [currentPlayer, setCurrentPlayer] = useState('vitekform');

    // Načtení statistik z localStorage (protože je to jednoduché řešení pro uložení statistik a je to *relativne* persistentní)
    useEffect(() => {
        const savedStats = localStorage.getItem('battleshipStats');
        if (savedStats) {
            setPlayerStats(JSON.parse(savedStats));
        }
    }, []);

    // Uložení statistik do localStorage
    const saveStats = (stats) => {
        setPlayerStats(stats);
        localStorage.setItem('battleshipStats', JSON.stringify(stats));
    };

    // Funkce pro uložení statistik výhry
    const handleGameWon = (stats) => {
        if (currentPlayer) {
            const newStats = { ...playerStats };
            if (!newStats[currentPlayer]) newStats[currentPlayer] = [];
            newStats[currentPlayer].push({ ...stats, result: 'win' });
            saveStats(newStats);
        }
    };

    // Funkce pro uložení statistik prohry
    const handleGameLost = (stats) => {
        if (currentPlayer) {
            const newStats = { ...playerStats };
            if (!newStats[currentPlayer]) newStats[currentPlayer] = [];
            newStats[currentPlayer].push({ ...stats, result: 'loss' });
            saveStats(newStats);
        }
    };

    const startGame = (difficulty, customShips = null, gameType = 'classic') => {
        const config = DIFFICULTY_CONFIGS[difficulty];
        const ships = customShips || config.ships;

        if (gameType === 'competitive') {
            // Pro kompetitivní mód začneme s nastavením lodí
            const newGameState = {
                gameType: 'competitiveSetup',
                difficulty,
                boardSize: config.size,
                ships,
                playerBoard: createEmptyBoard(config.size),
                availableShips: { ...ships },
                placedShips: []
            };

            setGameState(newGameState);
            setGameMode('competitiveSetup');
            return;
        }

        const newGameState = {
            gameType,
            difficulty,
            boardSize: config.size,
            ships,
            playerBoard: createEmptyBoard(config.size),
            playerRevealedBoard: createEmptyBoard(config.size),
            computerBoard: createEmptyBoard(config.size),
            computerRevealedBoard: createEmptyBoard(config.size),
            playerGameBoard: null,
            computerGameBoard: null,
            moves: 0,
            computerMoves: 0,
            startTime: Date.now(),
            gameWon: false,
            winner: null,
            totalShipCells: 0,
            playerShipCells: 0,
            computerShipCells: 0,
            turn: 'player',
            aiShots: [],
            currentTime: 0
        };

        // Generování pozic lodí pro počítač
        const { board: computerBoard, totalCells: computerTotal } = generateShipPositions(config.size, ships);
        newGameState.computerGameBoard = computerBoard;
        newGameState.computerShipCells = computerTotal;
        newGameState.totalShipCells = computerTotal;

        setGameState(newGameState);
        setGameMode('game');
    };

    // Z názvu asi tušíte co to bude dělat :D (započne kompetitivní hru)
    const startCompetitiveGame = (playerBoard) => {
        const config = DIFFICULTY_CONFIGS[gameState.difficulty];
        const ships = gameState.ships;

        const newGameState = {
            gameType: 'competitive',
            difficulty: gameState.difficulty,
            boardSize: config.size,
            ships,
            playerBoard: createEmptyBoard(config.size),
            playerRevealedBoard: createEmptyBoard(config.size),
            computerBoard: createEmptyBoard(config.size),
            computerRevealedBoard: createEmptyBoard(config.size),
            playerGameBoard: playerBoard,
            computerGameBoard: null,
            moves: 0,
            computerMoves: 0,
            startTime: Date.now(),
            gameWon: false,
            winner: null,
            totalShipCells: 0,
            playerShipCells: playerBoard.flat().filter(cell => cell > 0).length,
            computerShipCells: 0,
            turn: 'player',
            aiShots: [],
            currentTime: 0
        };

        // Generování pozic lodí pro počítač
        const { board: computerBoard, totalCells: computerTotal } = generateShipPositions(config.size, ships);
        newGameState.computerGameBoard = computerBoard;
        newGameState.computerShipCells = computerTotal;

        setGameState(newGameState);
        setGameMode('competitive');
    };

    // Zapne editor s danou obtížností
    const startEditor = (difficulty) => {
        setGameState({
            mode: 'editor',
            difficulty,
            boardSize: DIFFICULTY_CONFIGS[difficulty].size,
            ships: { ...DIFFICULTY_CONFIGS[difficulty].ships },
            board: createEmptyBoard(DIFFICULTY_CONFIGS[difficulty].size),
            availableShips: { ...DIFFICULTY_CONFIGS[difficulty].ships },
            placedShips: []
        });
        setGameMode('editor');
    };

    // HTML kód pro apku (včetně všech komponent)
    return (
        <div className="app">
            <h1>Námořní bitva</h1>

            {gameMode === 'menu' && (
                <MainMenu
                    onStartGame={startGame}
                    onStartEditor={startEditor}
                    onShowStats={() => setGameMode('stats')}
                    currentPlayer={currentPlayer}
                    setCurrentPlayer={setCurrentPlayer}
                />
            )}

            {gameMode === 'game' && (
                <GameComponent
                    gameState={gameState}
                    setGameState={setGameState}
                    onBackToMenu={() => setGameMode('menu')}
                    onGameWon={handleGameWon}
                />
            )}

            {gameMode === 'competitiveSetup' && (
                <CompetitiveSetupComponent
                    gameState={gameState}
                    setGameState={setGameState}
                    onBackToMenu={() => setGameMode('menu')}
                    onStartGame={startCompetitiveGame}
                />
            )}

            {gameMode === 'competitive' && (
                <CompetitiveComponent
                    gameState={gameState}
                    setGameState={setGameState}
                    onBackToMenu={() => setGameMode('menu')}
                    onGameWon={handleGameWon}
                    onGameLost={handleGameLost}
                />
            )}

            {gameMode === 'editor' && (
                <EditorComponent
                    gameState={gameState}
                    setGameState={setGameState}
                    onBackToMenu={() => setGameMode('menu')}
                    onStartGame={startGame}
                />
            )}

            {gameMode === 'stats' && (
                <StatsComponent
                    playerStats={playerStats}
                    currentPlayer={currentPlayer}
                    onBackToMenu={() => setGameMode('menu')}
                />
            )}
        </div>
    );
};

// Komponenta hlavního menu
const MainMenu = ({ onStartGame, onStartEditor, onShowStats, currentPlayer, setCurrentPlayer }) => {
    const [selectedDifficulty, setSelectedDifficulty] = useState('9x9'); // Výchozí obtížnost
    const [customShips, setCustomShips] = useState(null); // Defaultem použij well default :D (to co je nadefinované na řádku 20)

    return (
        <div className="main-menu">
            <div className="player-section">
                <h3>Přihlášení hráče</h3>
                <input
                    type="text"
                    placeholder="Zadejte přezdívku"
                    value={currentPlayer}
                    onChange={(e) => setCurrentPlayer(e.target.value)}
                />
            </div>

            <div className="difficulty-section">
                <h3>Vyberte obtížnost</h3>
                {Object.entries(DIFFICULTY_CONFIGS).map(([key, config]) => (
                    <div key={key} className="difficulty-option">
                        <label>
                            <input
                                type="radio"
                                value={key}
                                checked={selectedDifficulty === key}
                                onChange={(e) => setSelectedDifficulty(e.target.value)}
                            />
                            {key} - {Object.entries(config.ships).map(([ship, count]) =>
                            count > 0 ? `${SHIP_TYPES[ship].name}: ${count}` : null
                        ).filter(Boolean).join(', ')}
                        </label>
                    </div>
                ))}
            </div>

            <div className="custom-ships-section">
                <h3>Vlastní nastavení lodí (volitelné)</h3>
                <CustomShipSelector
                    difficulty={selectedDifficulty}
                    onShipsChange={setCustomShips}
                />
            </div>

            <div className="menu-buttons">
                <button onClick={() => onStartGame(selectedDifficulty, customShips, 'classic')}>
                    Hrát proti počítači (Klasický mód)
                </button>
                <button onClick={() => onStartGame(selectedDifficulty, customShips, 'competitive')}>
                    Hrát proti počítači (Kompetitivní mód)
                </button>
                <button onClick={() => onStartEditor(selectedDifficulty)}>
                    Editor herního pole
                </button>
                <button onClick={onShowStats}>
                    Statistiky
                </button>
            </div>
        </div>
    );
};

// Komponenta pro výběr vlastních lodí
const CustomShipSelector = ({ difficulty, onShipsChange }) => {
    // (Overridne to defaultní lodě pro danou obtížnost) (ale musí se to držet v rámci maximálního počtu lodí)
    const [ships, setShips] = useState({ ...DIFFICULTY_CONFIGS[difficulty].ships });
    const maxShips = DIFFICULTY_CONFIGS[difficulty].ships;

    const updateShip = (shipType, count) => {
        const newShips = { ...ships, [shipType]: Math.max(0, Math.min(count, maxShips[shipType])) };
        setShips(newShips);
        onShipsChange(newShips);
    };

    return (
        <div className="custom-ships">
            {Object.entries(SHIP_TYPES).map(([shipType, shipInfo]) => (
                <div key={shipType} className="ship-selector">
                    <label>{shipInfo.name}: </label>
                    <input
                        type="number"
                        min="0"
                        max={maxShips[shipType]}
                        value={ships[shipType]}
                        onChange={(e) => updateShip(shipType, parseInt(e.target.value) || 0)}
                    />
                    <span> (max: {maxShips[shipType]})</span>
                </div>
            ))}
        </div>
    );
};

// Komponenta pro nastavení lodí v kompetitivním módu (basically editor pro kompetitivní hru)
const CompetitiveSetupComponent = ({ gameState, setGameState, onBackToMenu, onStartGame }) => {
    const [selectedShip, setSelectedShip] = useState(null);
    const [shipRotation, setShipRotation] = useState(0);

    const handleCellClick = (row, col) => {
        if (!selectedShip) return;

        const rotatedShape = rotateShipShape(SHIP_TYPES[selectedShip].shape, shipRotation);

        if (canPlaceShip(gameState.playerBoard, row, col, rotatedShape)) {
            const newBoard = [...gameState.playerBoard];
            const newAvailableShips = { ...gameState.availableShips };
            const newPlacedShips = [...gameState.placedShips];

            placeShipOnBoard(newBoard, row, col, rotatedShape, gameState.placedShips.length + 1);
            newAvailableShips[selectedShip]--;
            newPlacedShips.push({
                type: selectedShip,
                row,
                col,
                rotation: shipRotation,
                id: gameState.placedShips.length + 1
            });

            // Nastavíme gameState na well nový stav :D (nevím jak jinak bych to okomentoval :D)
            setGameState({
                ...gameState,
                playerBoard: newBoard,
                availableShips: newAvailableShips,
                placedShips: newPlacedShips
            });

            // Pokud už není žádná loď tohoto typu dostupná, zrušíme výběr lodě
            if (newAvailableShips[selectedShip] === 0) {
                setSelectedShip(null);
            }
        }
    };

    // Tipuju že by to mohlo být jasné, ale pro jistotu: tato funkce odstraní loď z desky a aktualizuje dostupné lodě
    const removeShip = (shipId) => {
        const ship = gameState.placedShips.find(s => s.id === shipId);
        if (!ship) return;

        const newBoard = gameState.playerBoard.map(row =>
            row.map(cell => cell === shipId ? 0 : cell)
        );
        const newAvailableShips = { ...gameState.availableShips };
        const newPlacedShips = gameState.placedShips.filter(s => s.id !== shipId);

        newAvailableShips[ship.type]++;

        setGameState({
            ...gameState,
            playerBoard: newBoard,
            availableShips: newAvailableShips,
            placedShips: newPlacedShips
        });
    };


    // To co použije totální náhodu a nacpe vám to lodě na desku (pro kompetitivní mód)
    const autoPlaceShips = () => {
        const { board, placedShips } = generatePlayerShipPositions(
            gameState.boardSize,
            gameState.ships
        );

        setGameState({
            ...gameState,
            playerBoard: board,
            availableShips: Object.fromEntries(Object.keys(gameState.ships).map(ship => [ship, 0])),
            placedShips: placedShips
        });
    };

    // Smaže všechny lodě z desky a nastaví desku na prázdnou (pro kompetitivní mód)
    const clearBoard = () => {
        setGameState({
            ...gameState,
            playerBoard: createEmptyBoard(gameState.boardSize),
            availableShips: { ...gameState.ships },
            placedShips: []
        });
        setSelectedShip(null);
    };

    const allShipsPlaced = Object.values(gameState.availableShips).every(count => count === 0);

    return (
        <div className="competitive-setup">
            <div className="setup-header">
                <h2>Kompetitivní mód - Rozmístěte své lodě</h2>
                <p>Obtížnost: {gameState.difficulty}</p>
            </div>

            <div className="setup-container">
                <div className="setup-controls">
                    <div className="ship-harbor">
                        <h4>Dostupné lodě</h4>
                        {Object.entries(gameState.availableShips).map(([shipType, count]) => (
                            count > 0 && (
                                <div key={shipType} className="harbor-ship">
                                    <button
                                        className={selectedShip === shipType ? 'selected' : ''}
                                        onClick={() => setSelectedShip(shipType)}
                                    >
                                        {SHIP_TYPES[shipType].name} ({count})
                                    </button>
                                </div>
                            )
                        ))}

                        {Object.values(gameState.availableShips).every(count => count === 0) && (
                            <p className="all-ships-placed">✅ Všechny lodě umístěny!</p>
                        )}
                    </div>

                    {selectedShip && (
                        <div className="ship-controls">
                            <h4>Vybraná loď: {SHIP_TYPES[selectedShip].name}</h4>
                            <button onClick={() => setShipRotation((shipRotation + 90) % 360)}>
                                Otočit (aktuálně: {shipRotation}°)
                            </button>
                            <div className="ship-preview">
                                <ShipPreview shape={SHIP_TYPES[selectedShip].shape} rotation={shipRotation} />
                            </div>
                        </div>
                    )}

                    <div className="setup-actions">
                        <button onClick={autoPlaceShips} className="auto-place">
                            Automatické rozmístění
                        </button>
                        <button onClick={clearBoard} className="clear-board">
                            Vymazat vše
                        </button>
                    </div>
                </div>

                <div className="setup-board-container">
                    <h4>Vaše vody</h4>
                    <SetupBoard
                        board={gameState.playerBoard}
                        size={gameState.boardSize}
                        onCellClick={handleCellClick}
                        onShipRemove={removeShip}
                        selectedShip={selectedShip}
                        shipRotation={shipRotation}
                    />
                </div>
            </div>

            <div className="setup-navigation">
                <button onClick={onBackToMenu} className="back-button">
                    Zpět do menu
                </button>
                {allShipsPlaced && (
                    <button
                        onClick={() => onStartGame(gameState.playerBoard)}
                        className="start-game-button"
                    >
                        Začít hru!
                    </button>
                )}
            </div>
        </div>
    );
};

// Komponenta pro náhled lodě
const ShipPreview = ({ shape, rotation }) => {
    const rotatedShape = rotateShipShape(shape, rotation);

    return (
        <div className="ship-preview-grid" style={{
            gridTemplateColumns: `repeat(${rotatedShape[0].length}, 1fr)`,
            gridTemplateRows: `repeat(${rotatedShape.length}, 1fr)`
        }}>
            {rotatedShape.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                    <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`preview-cell ${cell === 1 ? 'ship' : 'empty'}`}
                    />
                ))
            )}
        </div>
    );
};

// Komponenta pro setup desku
const SetupBoard = ({ board, size, onCellClick, onShipRemove, selectedShip, shipRotation }) => {
    const [hoverPreview, setHoverPreview] = useState(null);

    const handleMouseEnter = (row, col) => {
        if (!selectedShip) return;

        const rotatedShape = rotateShipShape(SHIP_TYPES[selectedShip].shape, shipRotation);
        const canPlace = canPlaceShip(board, row, col, rotatedShape);

        if (canPlace) {
            setHoverPreview({ row, col, shape: rotatedShape });
        }
    };

    // Když se nám myška posuně z buňky, zrušíme náhled (protože jinak by to za chvíli bylo celé označené :D)
    const handleMouseLeave = () => {
        setHoverPreview(null);
    };

    // Kontrola, zda je buňka součástí náhledu (pro zvýraznění)
    const isHoverCell = (row, col) => {
        if (!hoverPreview) return false;

        const { row: startRow, col: startCol, shape } = hoverPreview;

        for (let r = 0; r < shape.length; r++) {
            for (let c = 0; c < shape[0].length; c++) {
                if (shape[r][c] === 1 && startRow + r === row && startCol + c === col) {
                    return true;
                }
            }
        }
        return false;
    };

    return (
        <div className="setup-board" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
            {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                    <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`cell ${
                            cell > 0 ? 'ship' : 'water'
                        } ${isHoverCell(rowIndex, colIndex) ? 'hover-preview' : ''}`}
                        onClick={() => cell > 0 ? onShipRemove(cell) : onCellClick(rowIndex, colIndex)}
                        onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                        onMouseLeave={handleMouseLeave}
                    >
                        {cell > 0 ? '🚢' : ''}
                    </div>
                ))
            )}
        </div>
    );
};

// Herní komponenta (klasický mód)
const GameComponent = ({ gameState, setGameState, onBackToMenu, onGameWon }) => {
    const [currentTime, setCurrentTime] = useState(0);

    // Aktualizace času každou sekundu
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Math.floor((Date.now() - gameState.startTime) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [gameState.startTime]);

    // Funkce pro zpracování kliknutí na buňku (aneb když někam strílíte)
    const handleCellClick = (row, col) => {
        if (gameState.gameWon || gameState.computerRevealedBoard[row][col] !== 0) return;

        const newRevealedBoard = [...gameState.computerRevealedBoard];
        const cellValue = gameState.computerGameBoard[row][col];

        newRevealedBoard[row][col] = cellValue === 0 ? -1 : cellValue;
        const newMoves = gameState.moves + 1;

        let revealedShipCells = 0;
        for (let i = 0; i < gameState.boardSize; i++) {
            for (let j = 0; j < gameState.boardSize; j++) {
                if (newRevealedBoard[i][j] > 0) revealedShipCells++;
            }
        }

        const gameWon = revealedShipCells >= gameState.totalShipCells;

        if (gameWon) {
            const gameTime = Date.now() - gameState.startTime;
            onGameWon({
                difficulty: gameState.difficulty,
                ships: gameState.ships,
                moves: newMoves,
                time: gameTime,
                date: new Date().toISOString(),
                gameType: 'classic'
            });
        }

        setGameState({
            ...gameState,
            computerRevealedBoard: newRevealedBoard,
            moves: newMoves,
            gameWon
        });
    };

    return (
        <div className="game-container">
            <div className="game-info">
                <h3>Klasický mód - {gameState.difficulty}</h3>
                <p>Tahy: {gameState.moves}</p>
                <p>Čas: {currentTime}s</p>
                {gameState.gameWon && <p className="victory">Gratulujeme! Všechny lodě potopeny!</p>}
            </div>

            <div className="single-board-container">
                <h4>Nepřátelské vody</h4>
                <GameBoard
                    board={gameState.computerRevealedBoard}
                    gameBoard={gameState.computerGameBoard}
                    size={gameState.boardSize}
                    onCellClick={handleCellClick}
                    showShips={gameState.gameWon}
                />
            </div>

            <button onClick={onBackToMenu}>Zpět do menu</button>
        </div>
    );
};

// Kompetitivní herní komponenta
const CompetitiveComponent = ({ gameState, setGameState, onBackToMenu, onGameWon, onGameLost }) => {
    const [currentTime, setCurrentTime] = useState(0);

    // Už zase updatujeme čas každou sekundu
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Math.floor((Date.now() - gameState.startTime) / 1000));
        }, 1000);

        return () => clearInterval(interval);
    }, [gameState.startTime]);

    useEffect(() => {
        if (gameState.turn === 'computer' && !gameState.gameWon) {
            const timer = setTimeout(() => {
                makeAIMove();
            }, 1000);

            return () => clearTimeout(timer);
        }
    }, [gameState.turn, gameState.gameWon]);

    // Funkce pro zpracování kliknutí na buňku (aneb když hráč střílí)
    const handlePlayerMove = (row, col) => {
        if (gameState.gameWon || gameState.turn !== 'player' || gameState.computerRevealedBoard[row][col] !== 0) return;

        const newComputerRevealedBoard = [...gameState.computerRevealedBoard];
        const cellValue = gameState.computerGameBoard[row][col];

        newComputerRevealedBoard[row][col] = cellValue === 0 ? -1 : cellValue;
        const newMoves = gameState.moves + 1;

        let playerRevealedShipCells = 0;
        for (let i = 0; i < gameState.boardSize; i++) { // PS: než mi odeberete body za to že ty variable nejsou hezky pojmenované, tak bych chtěl vědět jak vy pojmováváte proměnné v cyklu :D
            for (let j = 0; j < gameState.boardSize; j++) {
                if (newComputerRevealedBoard[i][j] > 0) playerRevealedShipCells++;
            }
        }

        const playerWon = playerRevealedShipCells === gameState.computerShipCells;

        if (playerWon) {
            const gameTime = Date.now() - gameState.startTime;
            onGameWon({
                difficulty: gameState.difficulty,
                ships: gameState.ships,
                moves: newMoves,
                computerMoves: gameState.computerMoves,
                time: gameTime,
                date: new Date().toISOString(),
                gameType: 'competitive',
                winner: 'player'
            });

            setGameState({
                ...gameState,
                computerRevealedBoard: newComputerRevealedBoard,
                moves: newMoves,
                gameWon: true,
                winner: 'player'
            });
            return;
        }

        setGameState({
            ...gameState,
            computerRevealedBoard: newComputerRevealedBoard,
            moves: newMoves,
            turn: 'computer'
        });
    };


    // Super inteligentní AI tah (to je joke je to vypatlaný jak tágo :D (ale zase to funguje a je to rychlý :D)) (která se snaží najít nejpravděpodobnější cíl)
    const makeAIMove = () => {
        const availableTargets = [];

        for (let i = 0; i < gameState.boardSize; i++) {
            for (let j = 0; j < gameState.boardSize; j++) {
                if (gameState.playerRevealedBoard[i][j] === 0) {
                    availableTargets.push([i, j]);
                }
            }
        }

        // Pokud nejsou žádné dostupné cíle, skončíme (jak jsme se sem vůbec dostali :D)
        if (availableTargets.length === 0) return;

        // Funkce pro získání cíle na základě inteligentního výběru (zase hrozně chytrá funkce :D)
        let targetCell = getSmartAITarget(gameState, availableTargets);

        if (!targetCell) {
            const randomIndex = Math.floor(Math.random() * availableTargets.length);
            targetCell = availableTargets[randomIndex];
        }

        const [row, col] = targetCell; // row je řádek a col je sloupec
        const newPlayerRevealedBoard = [...gameState.playerRevealedBoard];
        const cellValue = gameState.playerGameBoard[row][col];

        newPlayerRevealedBoard[row][col] = cellValue === 0 ? -1 : cellValue; // -1 znamená, že to je voda (nebo prázdná buňka)
        const newComputerMoves = gameState.computerMoves + 1; // Počítač udělal další tah (jak jinak také :D)

        let aiRevealedShipCells = 0;
        for (let i = 0; i < gameState.boardSize; i++) {
            for (let j = 0; j < gameState.boardSize; j++) {
                if (newPlayerRevealedBoard[i][j] > 0) aiRevealedShipCells++;
            }
        }

        const aiWon = aiRevealedShipCells === gameState.playerShipCells; // Pokud AI potopila všechny lodě hráče, tak vyhrála (logic)

        if (aiWon) {
            const gameTime = Date.now() - gameState.startTime;
            onGameLost({
                difficulty: gameState.difficulty,
                ships: gameState.ships,
                moves: gameState.moves,
                computerMoves: newComputerMoves,
                time: gameTime,
                date: new Date().toISOString(),
                gameType: 'competitive',
                winner: 'computer'
            });
            setGameState({
                ...gameState,
                playerRevealedBoard: newPlayerRevealedBoard,
                computerMoves: newComputerMoves,
                gameWon: true,
                winner: 'computer'
            });
            return;
        }

        setGameState({
            ...gameState,
            playerRevealedBoard: newPlayerRevealedBoard,
            computerMoves: newComputerMoves,
            turn: 'player'
        });
    };

    // HTML kód (a komenty tam nebudou ani nejsou protože do HTML psát komentáře je Spain without the S :D)
    return (
        <div className="competitive-container">
            <div className="game-info">
                <h3>Kompetitivní mód - {gameState.difficulty}</h3>
                <p>Vaše tahy: {gameState.moves}</p>
                <p>Tahy počítače: {gameState.computerMoves}</p>
                <p>Čas: {currentTime}s</p>
                <p className={`turn-indicator ${gameState.turn}`}>
                    {gameState.gameWon
                        ? `Vyhrál: ${gameState.winner === 'player' ? 'Hráč' : 'Počítač'}!`
                        : `Na tahu: ${gameState.turn === 'player' ? 'Hráč' : 'Počítač'}`
                    }
                </p>
            </div>

            <div className="competitive-boards">
                <div className="board-section">
                    <h4>Vaše vody</h4>
                    <GameBoard
                        board={gameState.playerRevealedBoard}
                        gameBoard={gameState.playerGameBoard}
                        size={gameState.boardSize}
                        onCellClick={() => {}}
                        showShips={true}
                        isPlayerBoard={true}
                    />
                </div>

                <div className="board-section">
                    <h4>Nepřátelské vody</h4>
                    <GameBoard
                        board={gameState.computerRevealedBoard}
                        gameBoard={gameState.computerGameBoard}
                        size={gameState.boardSize}
                        onCellClick={handlePlayerMove}
                        showShips={gameState.gameWon}
                        disabled={gameState.turn !== 'player' || gameState.gameWon}
                    />
                </div>
            </div>

            <button onClick={onBackToMenu}>Zpět do menu</button>
        </div>
    );
};

// Komponenta editoru
const EditorComponent = ({ gameState, setGameState, onBackToMenu, onStartGame }) => {
    const [selectedShip, setSelectedShip] = useState(null);
    const [shipRotation, setShipRotation] = useState(0);

    const handleCellClick = (row, col) => {
        if (!selectedShip) return;

        const rotatedShape = rotateShipShape(SHIP_TYPES[selectedShip].shape, shipRotation);

        if (canPlaceShip(gameState.board, row, col, rotatedShape)) {
            const newBoard = [...gameState.board];
            const newAvailableShips = { ...gameState.availableShips };
            const newPlacedShips = [...gameState.placedShips];

            placeShipOnBoard(newBoard, row, col, rotatedShape, gameState.placedShips.length + 1);
            newAvailableShips[selectedShip]--;
            newPlacedShips.push({
                type: selectedShip,
                row,
                col,
                rotation: shipRotation,
                id: gameState.placedShips.length + 1
            });

            setGameState({
                ...gameState,
                board: newBoard,
                availableShips: newAvailableShips,
                placedShips: newPlacedShips
            });

            if (newAvailableShips[selectedShip] === 0) {
                setSelectedShip(null);
            }
        }
    };

    // Funkce pro odstranění lodě z desky a aktualizaci dostupných lodí
    const removeShip = (shipId) => {
        const ship = gameState.placedShips.find(s => s.id === shipId);
        if (!ship) return;

        const newBoard = gameState.board.map(row =>
            row.map(cell => cell === shipId ? 0 : cell)
        );
        const newAvailableShips = { ...gameState.availableShips };
        const newPlacedShips = gameState.placedShips.filter(s => s.id !== shipId);

        newAvailableShips[ship.type]++;

        setGameState({
            ...gameState,
            board: newBoard,
            availableShips: newAvailableShips,
            placedShips: newPlacedShips
        });
    };

    // Vyrobí a downloadne soubor s aktuálním stavem editoru
    const saveToFile = () => {
        const content = generateFileContent(gameState);
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'battleship.wshipfield';
        a.click();
    };

    // Načte soubor a aktualizuje stav editoru
    const loadFromFile = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                const parsedData = parseFileContent(content);

                setGameState({
                    ...gameState,
                    board: parsedData.board,
                    availableShips: parsedData.availableShips,
                    placedShips: parsedData.placedShips
                });
            } catch (error) {
                alert('Chyba při načítání souboru: ' + error.message);
            }
        };
        reader.readAsText(file);
    };

    // Spustí hru s aktuální deskou (pro editor)
    const startGameWithCurrentBoard = () => {
        const totalShipCells = gameState.board.flat().filter(cell => cell > 0).length;

        onStartGame(gameState.difficulty, gameState.ships, {
            board: gameState.board,
            totalShipCells
        });
    };

    return (
        <div className="editor-container">
            <div className="editor-controls">
                <h3>Editor - {gameState.difficulty}</h3>

                <div className="ship-harbor">
                    <h4>Přístav</h4>
                    {Object.entries(gameState.availableShips).map(([shipType, count]) => (
                        count > 0 && (
                            <div key={shipType} className="harbor-ship">
                                <button
                                    className={selectedShip === shipType ? 'selected' : ''}
                                    onClick={() => setSelectedShip(shipType)}
                                >
                                    {SHIP_TYPES[shipType].name} ({count})
                                </button>
                            </div>
                        )
                    ))}
                </div>

                {selectedShip && (
                    <div className="ship-controls">
                        <h4>Vybraná loď: {SHIP_TYPES[selectedShip].name}</h4>
                        <button onClick={() => setShipRotation((shipRotation + 90) % 360)}>
                            Otočit (aktuálně: {shipRotation}°)
                        </button>
                    </div>
                )}

                <div className="editor-actions">
                    <button onClick={saveToFile}>Uložit do souboru</button>
                    <label>
                        Načíst ze souboru:
                        <input type="file" accept=".wshipfield" onChange={loadFromFile} />
                    </label>

                    {gameState.placedShips.length > 0 && (
                        <button onClick={startGameWithCurrentBoard}>
                            Hrát s tímto polem
                        </button>
                    )}
                </div>
            </div>

            <div className="editor-board-container">
                <h4>Volné moře</h4>
                <EditorBoard
                    board={gameState.board}
                    size={gameState.boardSize}
                    onCellClick={handleCellClick}
                    onShipRemove={removeShip}
                    placedShips={gameState.placedShips}
                />
            </div>

            <button onClick={onBackToMenu}>Zpět do menu</button>
        </div>
    );
};

// Komponenta statistik
const StatsComponent = ({ playerStats, currentPlayer, onBackToMenu }) => {
    const playerGames = currentPlayer ? playerStats[currentPlayer] || [] : [];

    return (
        <div className="stats-container">
            <h3>Statistiky</h3>

            {currentPlayer ? (
                <div>
                    <h4>Hráč: {currentPlayer}</h4>
                    {playerGames.length === 0 ? (
                        <p>Zatím žádné hry.</p>
                    ) : (
                        <div className="stats-list">
                            {playerGames.map((game, index) => (
                                <div key={index} className="game-stat">
                                    <p><strong>Hra #{index + 1}</strong></p>
                                    <p>Mód: {game.gameType === 'competitive' ? 'Kompetitivní' : 'Klasický'}</p>
                                    <p>Obtížnost: {game.difficulty}</p>
                                    <p>Vaše tahy: {game.moves}</p>
                                    {game.computerMoves && <p>Tahy počítače: {game.computerMoves}</p>}
                                    <p>Čas: {Math.floor(game.time / 1000)}s</p>
                                    <p className={`result ${game.result || (game.winner === 'player' ? 'win' : 'loss')}`}>
                                        Výsledek: {
                                        game.result === 'win' || game.winner === 'player'
                                            ? '🏆 Výhra'
                                            : '💀 Prohra'
                                    }
                                    </p>
                                    <p>Datum: {new Date(game.date).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <p>Pro zobrazení statistik se prosím přihlaste.</p>
            )}

            <button onClick={onBackToMenu}>Zpět do menu</button>
        </div>
    );
};

// Komponenta herní desky
const GameBoard = ({ board, gameBoard, size, onCellClick, showShips, isPlayerBoard = false, disabled = false }) => {
    return (
        <div className={`game-board ${disabled ? 'disabled' : ''}`} style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
            {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                    <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`cell ${getCellClass(cell, gameBoard?.[rowIndex]?.[colIndex], showShips, isPlayerBoard)}`}
                        onClick={() => !disabled && onCellClick(rowIndex, colIndex)}
                    >
                        {getCellContent(cell, gameBoard?.[rowIndex]?.[colIndex], showShips, isPlayerBoard)}
                    </div>
                ))
            )}
        </div>
    );
};

// Komponenta editační desky
const EditorBoard = ({ board, size, onCellClick, onShipRemove, placedShips }) => {
    return (
        <div className="editor-board" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
            {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                    <div
                        key={`${rowIndex}-${colIndex}`}
                        className={`cell ${cell > 0 ? 'ship' : 'water'}`}
                        onClick={() => cell > 0 ? onShipRemove(cell) : onCellClick(rowIndex, colIndex)}
                    >
                        {cell > 0 ? '🚢' : ''}
                    </div>
                ))
            )}
        </div>
    );
};

// Pomocné funkce
const createEmptyBoard = (size) => {
    return Array(size).fill(null).map(() => Array(size).fill(0));
};

// Chcete si někam zastřílet?
const getCellClass = (revealedCell, gameCell, showShips, isPlayerBoard = false) => {
    if (revealedCell === -1) return 'miss';
    if (revealedCell > 0) return 'hit';
    if ((showShips || isPlayerBoard) && gameCell > 0) return 'ship-revealed';
    return 'unrevealed';
};

// Jakože pokud nechcete vidět jestli jste trefili nebo netrefili, tak je to zbytečný, ale pokud chcete, tak to ukáže co jste trefili nebo netrefili
const getCellContent = (revealedCell, gameCell, showShips, isPlayerBoard = false) => {
    if (revealedCell === -1) return '💧';
    if (revealedCell > 0) return '💥';
    if ((showShips || isPlayerBoard) && gameCell > 0) return '🚢';
    return '';
};

// Hrozně chytrá funkce co vygeneruje posice lodí na desce
const generateShipPositions = (boardSize, ships) => {
    const board = createEmptyBoard(boardSize);
    let totalCells = 0;
    let shipId = 1;

    for (const [shipType, count] of Object.entries(ships)) {
        for (let i = 0; i < count; i++) {
            let placed = false;
            let attempts = 0;

            while (!placed && attempts < 1000) {
                const row = Math.floor(Math.random() * boardSize);
                const col = Math.floor(Math.random() * boardSize);
                const rotation = Math.floor(Math.random() * 4) * 90;

                const rotatedShape = rotateShipShape(SHIP_TYPES[shipType].shape, rotation);

                if (canPlaceShip(board, row, col, rotatedShape)) {
                    placeShipOnBoard(board, row, col, rotatedShape, shipId);
                    totalCells += SHIP_TYPES[shipType].size;
                    shipId++;
                    placed = true;
                }
                attempts++;
            }
        }
    }

    return { board, totalCells };
};

// Funkce pro generování pozic lodí pro hráče (pro editor a kompetitivní mód)
const generatePlayerShipPositions = (boardSize, ships) => {
    const board = createEmptyBoard(boardSize);
    const placedShips = [];
    let shipId = 1;

    for (const [shipType, count] of Object.entries(ships)) {
        for (let i = 0; i < count; i++) {
            let placed = false;
            let attempts = 0;

            while (!placed && attempts < 1000) {
                const row = Math.floor(Math.random() * boardSize);
                const col = Math.floor(Math.random() * boardSize);
                const rotation = Math.floor(Math.random() * 4) * 90;

                const rotatedShape = rotateShipShape(SHIP_TYPES[shipType].shape, rotation);

                if (canPlaceShip(board, row, col, rotatedShape)) {
                    placeShipOnBoard(board, row, col, rotatedShape, shipId);
                    placedShips.push({
                        type: shipType,
                        row,
                        col,
                        rotation,
                        id: shipId
                    });
                    shipId++;
                    placed = true;
                }
                attempts++;
            }
        }
    }

    return { board, placedShips };
};

// Totálně super duper chytrá funkce, co najde nejpravděpodobnější cíl pro AI (nebo spíš náhodně vybere buňku, kde ještě nebylo stříleno) (ale snaží se najít buňku, která je nejblíž k nějaké již zasažené buňce)
const getSmartAITarget = (gameState, availableTargets) => {
    const { playerRevealedBoard, boardSize } = gameState;

    const hitCells = [];
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (playerRevealedBoard[i][j] > 0) {
                hitCells.push([i, j]);
            }
        }
    }

    if (hitCells.length === 0) return null;

    for (const [hitRow, hitCol] of hitCells) {
        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];

        for (const [dr, dc] of directions) {
            const newRow = hitRow + dr;
            const newCol = hitCol + dc;

            if (newRow >= 0 && newRow < boardSize &&
                newCol >= 0 && newCol < boardSize &&
                playerRevealedBoard[newRow][newCol] === 0) {
                return [newRow, newCol];
            }
        }
    }

    return null;
};

// Funkce pro otočení tvaru lodě podle zadané rotace (0, 90, 180, 270 stupňů)
const rotateShipShape = (shape, rotation) => {
    let rotated = shape;

    for (let i = 0; i < rotation / 90; i++) {
        const rows = rotated.length;
        const cols = rotated[0].length;
        const newShape = Array(cols).fill(null).map(() => Array(rows).fill(0));

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                newShape[c][rows - 1 - r] = rotated[r][c];
            }
        }
        rotated = newShape;
    }

    return rotated;
};

// Můžete umístit loď na desku? (odpověd zní maybe :D)
const canPlaceShip = (board, startRow, startCol, shape) => {
    const boardSize = board.length;

    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
            if (shape[r][c] === 1) {
                const boardRow = startRow + r;
                const boardCol = startCol + c;

                if (boardRow >= boardSize || boardCol >= boardSize || boardRow < 0 || boardCol < 0) {
                    return false;
                }

                if (board[boardRow][boardCol] !== 0) {
                    return false;
                }

                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const checkRow = boardRow + dr;
                        const checkCol = boardCol + dc;

                        if (checkRow >= 0 && checkRow < boardSize &&
                            checkCol >= 0 && checkCol < boardSize &&
                            board[checkRow][checkCol] !== 0) {
                            return false;
                        }
                    }
                }
            }
        }
    }

    return true;
};

// Funkce pro umístění lodě na desku
const placeShipOnBoard = (board, startRow, startCol, shape, shipId) => {
    for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[0].length; c++) {
            if (shape[r][c] === 1) {
                board[startRow + r][startCol + c] = shipId;
            }
        }
    }
};

// Generuje obsah souboru pro uložení stavu editoru
const generateFileContent = (gameState) => {
    const { boardSize, ships } = gameState;
    const shipCounts = Object.values(ships).join(';');
    const header = `${boardSize}x${boardSize};${shipCounts}`;

    const boardLines = gameState.board.map(row =>
        row.map(cell => cell > 0 ? 'L' : 'M').join('')
    );

    return [header, ...boardLines].join('\n');
};

// Funkce pro zpracování obsahu souboru a jeho převod na stav editoru
const parseFileContent = (content) => {
    const lines = content.trim().split('\n');
    const header = lines[0].split(';');
    const [sizeStr, ...shipCountsStr] = header;
    const size = parseInt(sizeStr.split('x')[0]);

    const shipTypes = Object.keys(SHIP_TYPES);
    const ships = {};
    const availableShips = {};

    shipCountsStr.forEach((count, index) => {
        const shipType = shipTypes[index];
        const shipCount = parseInt(count);
        ships[shipType] = shipCount;
        availableShips[shipType] = 0;
    });

    const board = lines.slice(1).map(line =>
        line.split('').map(char => char === 'L' ? 1 : 0)
    );

    return { board, ships, availableShips, placedShips: [] };
};

export default BattleShips;