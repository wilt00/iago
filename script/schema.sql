CREATE TABLE users (
    userid INTEGER PRIMARY KEY,
    username VARCHAR(32) NOT NULL,
    rating INTEGER NOT NULL,
    created DATETIME,
    active BOOLEAN
);

CREATE TABLE rating_history (
    time_stamp DATETIME NOT NULL,
    userid INTEGER NOT NULL,
    rating INTEGER NOT NULL,
    PRIMARY KEY(time_stamp, rating),
    FOREIGN KEY(userid) REFERENCES users(userid)
);

CREATE TABLE games (
    gameid INTEGER PRIMARY KEY,
    blackid INTEGER NOT NULL,
    whiteid INTEGER NOT NULL,
    result INTEGER NOT NULL,
    blackscore INTEGER,
    whitescore INTEGER,
    time_stamp DATETIME,
    FOREIGN KEY(blackid) REFERENCES users(userid),
    FOREIGN KEY(whiteid) REFERENCES users(userid)
);