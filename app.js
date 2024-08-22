document.addEventListener('DOMContentLoaded', function(){
    //dom elements
    const main = document.querySelector('main');
    const formName = document.querySelector('#form-name');

    //global functions
    function addGlobalEventListener(selector, eventType, callback, parentElement = document){
        parentElement.querySelector(selector).addEventListener(eventType, callback);
    }
    function submitForm(e){
        e.preventDefault();
        let name = formName.querySelector('#name').value;
        if(name){
            //save name in the localStorage
            localStorage.setItem('name', name);
            //redirect to game page
            window.location.href = 'game.html';
        }
    }
    //event listeners
    addGlobalEventListener('#form-name', 'submit', submitForm);
});