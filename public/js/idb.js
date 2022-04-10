// indexedDB placeholder | Mod 18 : Lesson 4, add offline persistence with IndexedDB refresher

// create a variable to hold db connection
let db;

// establish connection to IndexedDB called 'budget' and set it to version 1
const request = indexedDB.open('budget', 1)

// event will emit if db ver changes (nonexistant to v1, v1 to v2, etc)
request.onupgradeneeded = function(event) {
    // save a reference to the db
    const db = event.target.result;
    // create object store (table) called `budget` set to have an auto incrementing primary key
    db.createObjectStore('budget', {autoIncrement: true})
}

// upon successful
request.onsuccess = function(event) {
    // when db successfully created with object store 
    db = event.target.result;

    // check if app online, if yes run uploadData() function to send all local db data to api
    if (navigator.onLine) {
        uploadData()
    }
};

request.onerror = function(event) {
    // log err
    console.log(event.target.errorCode)
}

// this function will be executed if attempt to submit new budget info and there's no internet connected
function saveRecord(record) {
    // open a new transaction with db with read and write permissions
    const transaction = db.transaction(['new_budget'], 'readwrite');

    // access the object store for `new_budget`
    const budgetObjectStore = transaction.objectStore('new_budget');

    // add record to store with add method
    budgetObjectStore.add(record)
}

function uploadData() {
    // open transaction with db
    const transaction = db.transaction(['new_budget'], 'readwrite')

    // access object store
    const budgetObjectStore = transaction.objectStore('new_budget')

    // get all records from store and set to a var
    const getAll = budgetObjectStore.getAll();

    // if data in indexedDb's store, send to api server
    if (getAll.results.length > 0) {
        fetch('/api/transaction', {
            method: 'POST',
            body: JSON.stringify(getAll.result),
            headers: {
                Accept: 'application/json, text/plain, */*',
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(serverResponse => {
            if (serverResponse.message) {
                throw new Error(serverResponse);
            }
            // open one more transaction
            const transaction = db.transaction(['new_budget'], 'readwrite')
            // access new_budget object store
            const budgetObjectStore = transaction.objectStore('new_budget')
            // clear all items in store
            budgetObjectStore.clear();

            alert('All saved budgets have been submitted')
        })
        .catch(err => {
            console.log(err)
        })
    }
}