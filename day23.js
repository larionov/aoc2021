import { readLines } from 'https://deno.land/std@0.116.0/io/bufio.ts';
import { range } from 'https://deno.land/x/it_range@v1.0.3/range.mjs';
import { slidingWindows } from 'https://deno.land/std@0.116.0/collections/mod.ts';
import count from 'https://deno.land/x/denodash@0.1.3/src/collection/count.ts';
import { union } from 'https://deno.land/x/set_operations/mod.ts';
import { equal } from 'https://deno.land/x/equal/mod.ts';
const i10 = (v) => parseInt(v, 10);
const i2 = (v) => parseInt(v, 2);
const sort = (arr, f = (a, b) => a - b) => {
  const narr = [...arr];
  narr.sort(f);
  return narr;
};
const replaceAt = function (str, index, replacement) {
  return (
    str.substr(0, index) + replacement + str.substr(index + replacement.length)
  );
};
const h = (...v) => v.join('_');
import { permutationsWithReplacement } from 'https://deno.land/x/combinatorics/mod.ts';
import { BinaryHeap } from 'https://deno.land/x/collections@v0.10.2/binary_heap.ts';

function ascend([a1, a2, a3, a], [b1, b2, b3, b]) {
  return a1 - b1;
}

let all = [];

for await (let line of readLines(Deno.stdin)) {
  all.push(line);
}
delete all[0];
delete all[4];
all = all.filter(Boolean);

all = all
  .join('\n')
  .replace('A', 'E')
  .replace('B', 'F')
  .replace('C', 'G')
  .replace('D', 'H')
  .split('\n');

function getCost(player) {
  switch (player) {
    case 'A':
    case 'E':
      return 1;
    case 'B':
    case 'F':
      return 10;
    case 'C':
    case 'G':
      return 100;
    case 'D':
    case 'H':
      return 1000;
  }
  return 0;
}
function getPlayers(map) {
  const loc = [];
  for (let i in map) {
    for (let j in map[i]) {
      if (map[i][j].match(/[ABCDEFGH]/)) {
        loc.push([map[i][j], [i10(i), i10(j)]]);
      }
    }
  }
  return loc;
}

function getPlayersMap(map) {
  const loc = {};
  for (let i in map) {
    for (let j in map[i]) {
      if (map[i][j].match(/[ABCDEFGH]/)) {
        loc[map[i][j]] = [i10(i), i10(j)];
      }
    }
  }
  return loc;
}
const playerCols = {
  A: 3,
  B: 5,
  C: 7,
  D: 9,
  E: 3,
  F: 5,
  G: 7,
  H: 9,
};
const playerOp = {
  A: 'E',
  B: 'F',
  C: 'G',
  D: 'H',
  E: 'A',
  F: 'B',
  G: 'C',
  H: 'D',
};

const movesCache = {};
function possibleMoves(map, player) {
  const key = player + map.join('\n');
  if (movesCache[key]) return movesCache[key];
  const visited = {};
  const resultPaths = [];
  const helper = ([y, x], path = []) => {
    if (visited[h(y, x)]) return;
    visited[h(y, x)] = true;
    resultPaths.push(path);
    const movesAvailable = [];
    if (y === 2) {
      if (map[y - 1][x] === '.') movesAvailable.push([y - 1, x]);
    } else if (y === 1) {
      if (map[y - 1][x] === '.') movesAvailable.push([y - 1, x]);
      if (map[y + 1][x] === '.') movesAvailable.push([y + 1, x]);
    } else if (y === 0) {
      if (map[y + 1][x] === '.') movesAvailable.push([y + 1, x]);
      if (map[y][x - 1] === '.') movesAvailable.push([y, x - 1]);
      if (map[y][x + 1] === '.') movesAvailable.push([y, x + 1]);
    }
    for (let move of movesAvailable) {
      helper(move, [...path, move]);
    }
  };
  const players = getPlayers(map);
  const [_, pos] = players.find(([p]) => p === player);
  helper(pos);
  let moves = resultPaths
    .filter((p) => p.length)
    .map((p) => [p[p.length - 1], p.length])
    .filter(([end, cost]) => !(end[0] === 0 && [3, 5, 7, 9].includes(end[1])));
  moves = moves.filter(([end, cost]) => end[0] !== pos[0]);
  moves = moves.filter(([end, cost]) => {
    if (end[0] === 2 && playerCols[player] === end[1]) return true;
    if (
      end[0] === 1 &&
      playerCols[player] === end[1] &&
      map[2][end[1]] === playerOp[player]
    )
      return true;
    if (end[0] === 0) return true;
    return false;
  });
  movesCache[key] = moves;
  return moves;
}

function checkWin(map) {
  const p = getPlayersMap(map);
  const locked = [];
  for (let c of 'ABCDEFGH') {
    if (p[c][1] === playerCols[c] && p[c][0] === 2) {
      locked.push(c);
    }
  }

  for (let c of [...locked]) {
    const col = playerCols[c];
    if (p[playerOp[c]][1] === col) locked.push(playerOp[c]);
  }
  return locked;
}

const copy = (m) => JSON.parse(JSON.stringify(m));
function playMove(map, [player, place]) {
  const newMap = copy(map);
  const players = getPlayers(map);
  const [_, initPos] = players.find((p) => p[0] === player);
  newMap[initPos[0]] = replaceAt(newMap[initPos[0]], initPos[1], '.');
  newMap[place[0]] = replaceAt(newMap[place[0]], place[1], player);
  return newMap;
}
function hash([cost, map]) {
  return map
    .join('')
    .replace('E', 'A')
    .replace('F', 'B')
    .replace('G', 'C')
    .replace('H', 'D');
}
function search(map) {
  const stack = new BinaryHeap(ascend);
  stack.push([0, copy(map), 0, 0]);

  const visited = {};
  let locked = []; //new Set();
  let i = 0;
  while (stack.length) {
    i++;
    if (i > 588) break;
    const s = stack.pop();
    const vis = visited[hash(s)];
    console.log(i, stack.length, { s, vis });
    if (vis !== undefined && vis <= s[0]) {
      continue;
    }
    visited[hash(s)] = s[0];
    const [cost, m] = s;

    locked = checkWin(m);
    if (locked.length === 8) {
      console.log('!!!!!!', { cost, m });
      return;
      continue;
    }
    const players = getPlayers(m);
    for (let [player, _] of players) {
      if (locked.includes(player)) continue;
      const moves = possibleMoves(m, player);
      for (let [place, addCost] of moves) {
        const mp = playMove(m, [player, place]);
        const newCost = cost + addCost * getCost(player);
        stack.push([newCost, mp]);
      }
    }
  }
}
search(all);
