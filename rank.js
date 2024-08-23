document.addEventListener('DOMContentLoaded', function(){
    //dom elements
    const currentRecordDOM = document.querySelector('#current-record');
    const recordsDOM = document.querySelector('#table-record');
    //states
    let currentRecord = {};
    let records = [];

    //onload function calls
    getRecords();

    //functions
    function getRecords(){
        records = JSON.parse(localStorage.getItem('ranks'));
        records.sort((a, b) =>{
            return b.score - a.score;
        });
        records.forEach((r , i) =>{
            r.rank = ++i;
            recordsDOM.innerHTML += `
                <tr>
                    <td>${r.rank}</td>  
                    <td>${r.name}</td>  
                    <td>${r.time}</td>  
                    <td>${r.score}</td>  
                </tr>
            `;

        })


        let currentUser =  localStorage.getItem('name');
        currentRecord = records.find( r => r.name === currentUser);
        //load currentRecord in the DOM
        currentRecordDOM.innerHTML = `
            <li>Ranking: ${currentRecord.rank}</li>
            <li>Time: ${currentRecord.time}</li>
            <li>Score: ${currentRecord.score}</li>
        `;
    }
});