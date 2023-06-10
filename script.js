console.log('JavaScript is working!');

// Setting some vars
let buttons;
let correctAnswer;
let counter = 0;
let difficulty = 'easy';
let token;

// Setting up the game - retrieving token, getting all buttons, 
// giving each button an event listener and starting the game
document.addEventListener('DOMContentLoaded', function () {
  getToken();
  buttons = document.querySelectorAll('.answer');

  buttons.forEach(button => {
    button.addEventListener('click', checkAnswer);
  });
});

/**
 *  An async function that acts as a game loop - it's called
 *  in the beginning and every time the user answers correctly
 */
async function gameLoop() {
  counter++;

  if (counter == 16) {
    goodGameOver();
  } else {
    if (counter < 16) {
      difficulty = 'hard';
    }
    if (counter < 10) {
      difficulty = 'medium';
    }
    if (counter < 5) {
      difficulty = 'easy';
    }

    await renderQuestion(difficulty);
  }
}

/**
 *  An async function that by given difficulty
 *  renders the question and the possible answers
 */
async function renderQuestion(difficulty) {
  let response = await retrieveQuestion(difficulty);

  while (response.results[0].response_code == 4) {
    let promise = await fetch(`https://opentdb.com/api_token.php?command=reset&token=${token}`);
    let result = await promise.json();

    token = result.token;
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('tokenSavedTime', Date.now());

    response = await retrieveQuestion(difficulty);
  }

  document.getElementById('question').innerHTML = `${counter}. ${response.results[0].question}`;
  let answers = await getAnswers(response.results[0]);

  let i = 0;
  buttons.forEach(button => {
    button.className = 'btn btn-primary btn-block answer';
    button.innerHTML = answers[i];
    i++;
  });
}

/**
 *  An asynch function that retrieves a question
 *  from the Trivia API by given difficulty
 */
async function retrieveQuestion(difficulty) {
  let promise = await fetch(`https://opentdb.com/api.php?amount=1&difficulty=${difficulty}&type=multiple&token=${token}`);
  return await promise.json();
}

/**
 *  A function that returns an array of all the possible
 *  answers for this questions
 */
function getAnswers(result) {
  let allAnswers = result.incorrect_answers;
  allAnswers.push(result.correct_answer);

  correctAnswer = result.correct_answer;

  return shuffleArray(allAnswers);
}

/** 
 *  Randomize array using Durstenfeld shuffle algorithm
 */
function shuffleArray(array) {
  for (var i = array.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }

  return array;
}

/**
 *  A function that is executed whenever a button has
 *  been pressed
 */
function checkAnswer(event) {
  const clickedButton = event.target;

  clickedButton.classList.remove('flash', 'correct', 'wrong');

  clickedButton.classList.add('flash');

  setTimeout(() => {
    clickedButton.classList.remove('flash');

    if (clickedButton.innerHTML == correctAnswer.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(dec))) {
      clickedButton.classList.add('correct');
      gameLoop();
    } else {
      clickedButton.classList.add('wrong');
      badGameOver();
    }
  }, 2000);
}

/**
 *  A function that creates dynamic dom elements for the 
 *  end of the game when the player has answered incorrectly
 */
function badGameOver() {
  buttons.forEach(button => {
    button.disabled = true;
  });

  let statusDiv = document.getElementById('status');
  statusDiv.innerHTML = '';

  const gameOverLabel = document.createElement('h1');
  gameOverLabel.textContent = 'Game Over';

  const correctAnswerLabel = document.createElement('h3');
  correctAnswerLabel.textContent = `The correct answer is ${correctAnswer}`;

  const newGameButton = document.createElement('button');
  newGameButton.textContent = 'Start New Game';
  newGameButton.className = 'btn btn-info';
  newGameButton.addEventListener("click", function () {
    location.reload();
  });

  statusDiv.appendChild(gameOverLabel);
  statusDiv.appendChild(correctAnswerLabel);
  statusDiv.appendChild(newGameButton);
}

/**
 *  A function that creates dynamic dom elements for the 
 *  end of the game when the player has answered all questions
 *  correctly
 */
function goodGameOver() {
  buttons.forEach(button => {
    button.disabled = true;
  });

  let statusDiv = document.getElementById('status');
  statusDiv.innerHTML = '';

  const gameOverLabel = document.createElement('h1');
  gameOverLabel.textContent = 'Congratulations';

  const correctAnswerLabel = document.createElement('h3');
  correctAnswerLabel.textContent = `You answered all 15 questions correctly`;

  const newGameButton = document.createElement('button');
  newGameButton.textContent = 'Start New Game';
  newGameButton.className = 'btn btn-info';
  newGameButton.addEventListener("click", function () {
    location.reload();
  });

  statusDiv.appendChild(gameOverLabel);
  statusDiv.appendChild(correctAnswerLabel);
  statusDiv.appendChild(newGameButton);
}

/**
 * A function that retrieves the token. If the token has expired (6 hours or more)
 * create a new one and save it in the session storage and starts the game
 */
async function getToken() {
  const savedTime = sessionStorage.getItem('tokenSavedTime');

  if (savedTime && Date.now() - savedTime < 6 * 60 * 60 * 1000 && sessionStorage.getItem('token')) {
    token = sessionStorage.getItem('token');
  } else {
    let promise = await fetch('https://opentdb.com/api_token.php?command=request');
    let result = await promise.json();

    token = result.token;
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('tokenSavedTime', Date.now());
  }

  await gameLoop();
}
