import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Alert,
  Dimensions,
  Animated,
} from "react-native";
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";

const GRID_SIZE = 4;
const CELL_SIZE = Math.floor(Dimensions.get("window").width / GRID_SIZE) - 10;
const WINNING_TILE = 2048;

export default function App() {
  const [grid, setGrid] = useState(generateGrid());
  const [prevGrid, setPrevGrid] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  
  useEffect(() => {
    if (isGameOver(grid)) {
      setGameOver(true);
      showGameOverAlert();
    }
    if (hasWon(grid)) {
      Alert.alert("You win!", "Congratulations, you reached 2048!");
    }
  }, [grid]);

  const handleSwipe = useCallback(
    ({ nativeEvent }) => {
      if (gameOver) return;

      const { translationX, translationY } = nativeEvent;
      let newGrid;

      setPrevGrid([...grid.map((row) => [...row])]);

      if (Math.abs(translationX) > Math.abs(translationY)) {
        newGrid = translationX > 0 ? moveRight(grid) : moveLeft(grid);
      } else {
        newGrid = translationY > 0 ? moveDown(grid) : moveUp(grid);
      }

      if (JSON.stringify(grid) !== JSON.stringify(newGrid)) {
        setGrid(addRandomTile(newGrid));
      }
    },
    [gameOver, grid]
  );

  const resetGame = () => {
    setGrid(generateGrid());
    setPrevGrid(null);
    setGameOver(false);
  };

  const undoLastMove = () => {
    if (prevGrid) {
      setGrid(prevGrid);
      setGameOver(false);
    } else {
      Alert.alert("No moves to undo", "You haven’t made any moves yet.");
    }
  };

  const showGameOverAlert = () => {
    Alert.alert(
      "Game Over",
      "No more moves left!",
      [
        {
          text: "Undo Last Move",
          onPress: undoLastMove,
        },
        {
          text: "Restart Game",
          onPress: resetGame,
        },
      ],
      { cancelable: false }
    );
  };


  return (
    <GestureHandlerRootView style={styles.container}>
      <PanGestureHandler onEnded={handleSwipe}>
        <Animated.View style={styles.grid}>
          {grid.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.row}>
              {row.map((cell: any, colIndex: React.Key | null | undefined) => (
                <Tile key={colIndex} value={cell} />
              ))}
            </View>
          ))}
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
}

const Tile = React.memo(({ value }) => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 500, // Increase duration for a slower transition
      useNativeDriver: true,
    }).start();
  }, [value]);

  const tileStyle = {
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
    ],
  };

  return (
    <Animated.View
      style={[
        styles.cell,
        { backgroundColor: getTileColor(value) },
        tileStyle,
      ]}>
      <Text style={styles.cellText}>{value || ""}</Text>
    </Animated.View>
  );
});

function generateGrid() {
  let newGrid = Array(GRID_SIZE)
    .fill(null)
    .map(() => Array(GRID_SIZE).fill(0));
  newGrid = addRandomTile(newGrid);
  return addRandomTile(newGrid);
}

function addRandomTile(grid: any[]) {
  let emptyCells: { rowIndex: any; colIndex: any; }[] = [];
  grid.forEach((row, rowIndex) => {
    row.forEach((cell: number, colIndex: any) => {
      if (cell === 0) emptyCells.push({ rowIndex, colIndex });
    });
  });

  if (emptyCells.length === 0) return grid;

  const { rowIndex, colIndex } =
    emptyCells[Math.floor(Math.random() * emptyCells.length)];
  grid[rowIndex][colIndex] = Math.random() > 0.1 ? 2 : 4;

  return grid;
}

function moveLeft(grid: any[]) {
  return grid.map((row) => mergeRow(row));
}

function moveRight(grid: any[]) {
  return grid.map((row) => mergeRow(row.reverse()).reverse());
}

function moveUp(grid: any[][] | { [x: string]: any; }[]) {
  return transpose(moveLeft(transpose(grid)));
}

function moveDown(grid: any[][] | { [x: string]: any; }[]) {
  return transpose(moveRight(transpose(grid)));
}

// function mergeRow(row: any[]) {
//   let arr = row.filter((val: any) => val);
//   for (let i = 0; i < arr.length - 1; i++) {
//     if (arr[i] === arr[i + 1]) {
//       arr[i] *= 2;
//       arr[i + 1] = 0;
//     }
//   }
//   return [
//     ...arr.filter((val: any) => val),
//     ...Array(GRID_SIZE - arr.filter((val: any) => val).length).fill(0),
//   ];
// }

function mergeRow(row) {
  let arr = row.filter((val) => val); // filter out 0s
  let merged = false; // track if a merge has already happened
  for (let i = 0; i < arr.length - 1; i++) {
    if (arr[i] === arr[i + 1] && !merged) {
      arr[i] *= 2;
      arr[i + 1] = 0;
      merged = true; // prevent consecutive merges
    }
  }
  return [
    ...arr.filter((val) => val),
    ...Array(GRID_SIZE - arr.filter((val) => val).length).fill(0),
  ];
}


function transpose(matrix: any[][] | { [x: string]: any; }[]) {
  return matrix[0].map((_: any, colIndex: string | number) => matrix.map((row: { [x: string]: any; }) => row[colIndex]));
}

function isGameOver(grid: any[][]) {
  if (grid.some((row: any[]) => row.some((cell) => cell === 0))) return false;

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (
        (i > 0 && grid[i][j] === grid[i - 1][j]) ||
        (i < GRID_SIZE - 1 && grid[i][j] === grid[i + 1][j]) ||
        (j > 0 && grid[i][j] === grid[i][j - 1]) ||
        (j < GRID_SIZE - 1 && grid[i][j] === grid[i][j + 1])
      ) {
        return false;
      }
    }
  }
  return true;
}

function hasWon(grid: any[]) {
  return grid.some((row: number[]) => row.some((cell: number) => cell >= WINNING_TILE));
}

function getTileColor(value: any) {
  switch (value) {
    case 0:
      return "#cdc1b4";
    case 2:
      return "#eee4da";
    case 4:
      return "#ede0c8";
    case 8:
      return "#f2b179";
    case 16:
      return "#f59563";
    case 32:
      return "#f67c5f";
    case 64:
      return "#f65e3b";
    case 128:
      return "#edcf72";
    case 256:
      return "#edcc61";
    case 512:
      return "#edc850";
    case 1024:
      return "#edc53f";
    case 2048:
      return "#edc22e";
    default:
      return "#3c3a32";
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#faf8ef",
  },

  grid: {
    width: "90%",
    aspectRatio: 1,
    backgroundColor: "#bbada0",
    padding: 5,
    borderRadius: 5,
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    borderRadius: 5,
  },
  cellText: {
    fontSize: 24,
    fontWeight: "bold",
  },
});
