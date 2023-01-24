const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running");
    });
  } catch (error) {
    console.log(`Db Error : ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertPlayerDbObjToResponseObj = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertMatchDbObjToResponseObj = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

// API 1
app.get("/players/", async (request, response) => {
  const getPlayerDetails = `
    SELECT * FROM 
    player_details;
    `;
  const playersArray = await db.all(getPlayerDetails);
  response.send(
    playersArray.map((eachPlayer) =>
      convertPlayerDbObjToResponseObj(eachPlayer)
    )
  );
});

//API 2
app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `
    SELECT * FROM player_details
    WHERE player_id = ${playerId};
    `;
  const player = await db.get(getPlayer);
  response.send(convertPlayerDbObjToResponseObj(player));
});

// API 3
app.put("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const updatePlayer = `
    UPDATE player_details
    SET    
    player_name = '${playerName}'
    WHERE player_id = ${playerId};
    `;
  await db.run(updatePlayer);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId", async (request, response) => {
  const { matchId } = request.params;
  const getMatch = `
    SELECT * FROM match_details
    WHERE match_id = ${matchId};
    `;
  const match = await db.get(getMatch);
  response.send(convertMatchDbObjToResponseObj(match));
});

// API 5
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getMatchByPlayedId = `
        SELECT * 
        FROM match_details NATURAL JOIN player_match_score
        WHERE player_id = ${playerId};
    `;
  const matchByIdArray = await db.all(getMatchByPlayedId);
  response.send(
    matchByIdArray.map((eachMatch) => convertMatchDbObjToResponseObj(eachMatch))
  );
});

// API 6
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerByMatchId = `
        SELECT * 
        FROM player_match_score NATURAL JOIN player_details
        WHERE match_id = ${matchId};
    `;
  const playerByIdArray = await db.all(getPlayerByMatchId);
  response.send(
    playerByIdArray.map((eachPlayer) =>
      convertPlayerDbObjToResponseObj(eachPlayer)
    )
  );
});

// API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getScores = `
     SELECT 
     player_details.player_id AS playerId,
     player_details.player_name AS playerName,
     SUM(player_match_score.score) AS totalScore,
     SUM(player_match_score.fours) AS totalFours,
     SUM(player_match_score.sixes) AS totalSixes
     FROM player_details INNER JOIN player_match_score 
     ON player_details.player_id =  player_match_score.player_id
     WHERE player_details.player_id = ${playerId};
     `;
  const playerScore = await db.get(getScores);
  response.send(playerScore);
});
module.exports = app;
