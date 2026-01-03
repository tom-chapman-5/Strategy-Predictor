//------------------------------ Change Theme ------------------------------//

// sets the local stylesheet
function setTheme(theme) {
    localStorage.setItem("stylesheet",theme); // set the item
    document.getElementById("mode").href = theme; // makes the stylesheet teh current one used
}

// makes the stylesheet used the one saved
window.onload = function() {
    const saved_theme = localStorage.getItem("stylesheet"); // gets the stylesheet saved locally and saves it as saved_theme
    if (saved_theme) {
        document.getElementById("mode").href = saved_theme; // gets the link element that contains the stylesheet and sets it as the saved_theme
    }
}

// called by the button to change the theme
function change_theme() {
    let style = document.getElementById("mode"); // gets the link element that contains the stylesheet
    if (style.getAttribute("href") == "styles_light.css") { // checks which stylesheet is being used
        setTheme("styles_dark.css"); // calls the setTheme function with the oposite theme stylesheet passed
    } else {
        setTheme("styles_light.css");
    }
}



//------------------------------ JSON access ------------------------------//

// calls the json file and checks the response is ok
function call_info(option) {
	fetch("https://raw.githubusercontent.com/tom-chapman-5/Home-Page-Info/refs/heads/main/home_info.json") // fetches JSON file
	.then(response => {
		if (!response.ok) { // if the response is not ok
			throw new Error(`HTTP error! Status: ${response.status}`); // throw an error
		}
        console.log("success");
		return response.json(); // return the resopnse
	})

    .then (data => {
        const info = data.find(d => d.heading === option); // finds the right object
        const info_box = document.getElementById("info_output"); // gets the HTML element to output to
        clear_info(); // calls the clear function
        if (option == "Weekend Structure") { // if the button clicked was Weekend Structure print what is below, calling the right info
            info_box.innerHTML = `
                <h2>${info.heading}</h2>
                <div style="margin-left: 5%;">
                    <h3>Normal Weekends</h3>
                    <ul>
                        <li>Friday: ${info.friday}</li>
                        <li>Saturday: ${info.saturday}</li>
                        <li>Sunday: ${info.sunday}</li>
                    </ul>

                    <h3>Sprint Weekends</h3>
                    <p>${info.sprint_race}</p>
                    <ul>
                        <li>Friday: ${info.friday_Sprint}</li>
                        <li>Saturday: ${info.saturday_Sprint}</li>
                        <li>Sunday: ${info.sunday_Sprint}</li>
                    </ul>

                    <h3>Qualifying</h3>
                    <p>${info.qualifying}</p>
                </div>
            `;
        } else if (option == "Tyres") { // if the button clicked was Tyres print what is below, calling the right info
            info_box.innerHTML = `
                <h2>${info.heading}</h2>
                <div style="margin-left: 3%;">
                    <p style="margin-bottom: 3%;">${info.tyres}</p>
                    <div class="tyre_info">
                        <img class="tyre_img" src="${info.soft}">
                        <p style="font-size: 90%; display: inline;">${info.soft_explained}</p>
                    </div>
                    <div class="tyre_info">
                        <img class="tyre_img" src="${info.medium}">
                        <p style="font-size: 90%; display: inline;">${info.medium_explained}</p>
                    </div>
                    <div class="tyre_info">
                        <img class="tyre_img" src="${info.hard}">
                        <p style="font-size: 90%; display: inline;">${info.hard_explained}</p>
                    </div>
                    <div class="tyre_info">
                        <img class="tyre_img" src="${info.intermediate}">
                        <p style="font-size: 90%; display: inline;">${info.intermediate_explained}</p>
                    </div>
                    <div class="tyre_info">
                        <img class="tyre_img" src="${info.wet}">
                        <p style="font-size: 90%; display: inline;">${info.hard_explained}</p>
                    </div>
                </div>
            `;
        } else if (option == "Car Components") { // if the button clicked was Car Components print what is below, calling the right info
            info_box.innerHTML = `
                <h2>${info.heading}</h2>
                    <div style="display: inline-block; width: 22%;">
                        <img src="${info.diagram}" width=100%>
                    </div>
                    <div style="display: inline-block; width: 77%; font-size: 90%; vertical-align: top;">
                        <ol>
                            <li>${info.rear_wing}</li>
                            <li>${info.engine_cover}</li>
                            <li>${info.floor}</li>
                            <li>${info.sidepod}</li>
                            <li>${info.chassis}</li>
                            <li>${info.halo}</li>
                            <li>${info.tyres}</li>
                            <li>${info.suspension}</li>
                            <li>${info.front_wing}</li>
                        </ol>
                    </div>
            `;
        }
    });
}

function clear_info() {
	const info_box = document.getElementById("info_output"); // gets the info_output element
    info_box.innerHTML = ''; // empties it
}



//------------------------------- Predictor -------------------------------//

function set_track(track) {
    localStorage.setItem("track",track); // stores the track locally
}

function set_weather(weather) {
    localStorage.setItem("weather",weather); // stores the weather locally
}

function set_track_temp(track_temp) {
    localStorage.setItem("track_temp",track_temp); // stores the track_temp locally
}

//-------------Main-Function-------------//
async function run_predictor() {
    const track = localStorage.getItem("track"); // call the track and stores it as a local variable
    const weather = localStorage.getItem("weather"); // call the weather and stores it as a local variable
    const track_temp = localStorage.getItem("track_temp"); // call the track temperature and stores it as a local variable

    console.log(track, weather, track_temp); // logs all thevariable as a test

    //-------------load-sessions-------------//
    let sessions;
    try {
        sessions = await fetch_session_keys(track); // call the fuction to request a session from the API
    } catch (error) {
        console.error("Error fetching session key:", error); // catches any errors
    }
    console.log(sessions); // logs the session key

    //-------------check-weather-------------//
    const rainfall = []; // an array to store the average rainfall for each session
    county = -1; // sets a counter to -1 so that when it is incremented it is at 0 for the array indexing
    for(const race of sessions) { // a loop that goes through all the sessions in the array sessions
        county++; // increments the counter
        let url = "https://api.openf1.org/v1/weather?session_key=" + sessions[county]; // sets a new url then selects the right session
        let rain;
        try {
            rain = await rain_check(url); // calls the rain_check function
        } catch (error) {
            console.error("Error fetching rainfall:", error); // catches any errors
        }
        rainfall.push(rain); // appends the new average rainfall number to the array
    }
    console.log(rainfall); // logs the array

    sessions = find_valid_races(rainfall, weather, sessions);
    console.log(sessions); // logs the session keys with these amendments

    let count = 0
    for (let i=0; i<sessions.length; i++) {
        console.log(sessions[i]);
        if (sessions[i] === -1) {
            count++;
        }
    }

    console.log(count);

    if (count === rainfall.length) {
        clear_info()
        output = document.getElementById("info_output")
        output.innerHTML = `
        <p>sorry, there is not enough data to make a prediction</p>
        `
        return;
    }

    //-------------find-driver-numbers-------------//
    const delay = (ms = 500) => {
            return new Promise(r => setTimeout(r, ms)
            );
        };

    const driver_numbers = [];
    for(const race of sessions) { // loops through the sessions
        if(race != -1) { // only performs code if the session key is valid
            for(let i=1; i<4; i++) {
                await delay();
                let url = "https://api.openf1.org/v1/session_result?session_key=" + race +"&position=" + i; // creates the custom url
                try {
                    driver_number = await load_results(url);
                } catch (error) {
                    console.error("Error fetching driver numbers:", error); // catches any errors
                }
                driver_numbers.push(driver_number);
            }
        }
    }
    console.log(driver_numbers);
    
    //-------------creates-strategies-------------//
    strategies = [];
    frequency = [];
    stint_lengths = [];
    multiplier = 0; // to multiply the index for the right driver numbers
    for(const race of sessions) { // loops through the array of races
        if(race != -1) {
            multiplier++; // increments the multiplier
            for(let i=1; i<4; i++) { // loops from 1 to 3
                await delay(); // to avoid 429 errors
                let url = "https://api.openf1.org/v1/stints?session_key=" + race + "&driver_number=" + driver_numbers[((i-1)+3*multiplier)-3]; // creates the url with the correct race and driver number
                try {
                    stints = await find_stints(url); // calls the find_stints function
                } catch (error) {
                    console.error("Error fetching stints:", error); // catches any errors
                }

                let strategy = ""; // creates a string for the strategy
                let lengths = [];
                let len = stints.length; // gets the length of strints
                for(let i=0; i<len; i++) { // loops from 0 to the length of stints-1
                    stint = stints[i]; // creates a single stint to store the first letter of the compound
                    strategy += stint.compound[0]; // adds the stint to the strategy to get a code like MHS
                    lengths.push(stint.lap_end - stint.lap_start);
                }

                search_result = search_strategies(strategies, frequency, strategy); // calls the linear search function
                if(search_result == -1) { // if the result is -1 it is empty
                    strategies.push(strategy); // adds the strategy to strategies
                    frequency.push(1); // add a new counter to frequency
                    stint_lengths.push(lengths);
                } else if(search_result == "new") { // if the result is new then it isn't already in the array
                    strategies.push(strategy); // adds the strategy to strategies
                    frequency.push(1); // add a new counter to frequency
                    stint_lengths.push(lengths);
                } else { // any other result will be an index
                    frequency[search_result] = frequency[search_result]+1; // increments the corresponing frequency
                }

            }
        } else {
            console.log("debug");
        }
    }
    console.log(strategies); // logs the strategies array
    console.log(frequency); // logs the frequency array
    console.log(stint_lengths); // logs the frequency array

    //---------------creates-graphs---------------//
    const mode = localStorage.getItem("stylesheet");
    let theme = null;
    if (mode === "styles_light.css") {
        theme = "light";
    } else if (mode === "styles_dark.css") {
        theme = "dark";
    }

    const data_to_send = { // creates dictionary (JSON format) with type and subject
        "strategies": strategies,
        "frequency": frequency,
        "lengths": stint_lengths,
        "theme": theme
    }

    let url = "http://localhost:5001/strategy";

    let data;
    try {
        data = await call_python(data_to_send, url) // calls the call_python function
    } catch(error) {
        console.error("Error fetching python:", error); // catches any errors
    }
    const graph = document.createElement("img"); // creates graph element
    graph.src = "data:image/png;base64," + data.image; // creates file
    graph.style.height = "90%";
    graph.style.width = "auto";

    clear_info() // calls function to clear the contents of the output box
    document.getElementById("info_output").appendChild(graph); // adds the graph to the page

}

function fetch_session_keys (track) {
    let url = "https://api.openf1.org/v1/sessions?circuit_key=" + track + "&session_name=Race"; // creates the correct URL with the track (circuit_key) added
    return fetch(url) // fetches from the API
        .then((response) => {
            if (!response.ok) { // checks the resopnse os ok
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
        })
        .then((data) => {
            const session1 = data[0].session_key; // selects the session key from the response
            const session2 = data[1].session_key;
            const sessions = [session1, session2];
            return sessions;
        })
        .catch(error => {
            console.error("Error fetching session key:", error); // catches any errors
            throw error;
        })
}

function rain_check (url) {
    return fetch(url)
        .then((response) => {
            if (!response.ok) { // checks the resopnse os ok
                throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
        })
        .then((data) => {
            let rain = 0; // sets a new variable rain
            let counter = 0; // sets a new counter
            for(const moment of data) { // a loop to go through all of the instances in the race
                rain += moment.rainfall; // adds the rainfall to the total
                counter++; // increments the counter
            }
            let avg_rain = rain / counter; // finds the average rain across the race
            return avg_rain; // returns the value to the run_predictor function
        })
        .catch(error => {
            console.error("Error fetching session key:", error); // catches any errors
            throw error;
        })
}

function find_valid_races (rainfall, weather, sessions) {
    let len = rainfall.length; // finds the length of the array rainfall
    if(weather == "rain") { // chechs the condition of the weather entered in the dropdown
        for(let i=0; i<len; i++) { // loops through the numbers 0 to the length of rainfall - 1
            if(rainfall[i] < 0.1) { // if there is insufficient rainfall
                sessions[i] = -1; // change the session key to -1
            }
        }
    } else {
        for(let i=0; i<len; i++) { // loops through the numbers 0 to the length of rainfall - 1
            if(rainfall[i] >= 0.1) { // if there is sufficient rainfall
                sessions[i] = -1; // change the session key to -1
            }
        }
    }
    return sessions;
}

function load_results(url) { 
    return fetch(url)
        .then((response) => {
            if (!response.ok) { // checks the resopnse os ok
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            return data[0].driver_number;
        })
        .catch(error => {
            console.error("Error fetching session key:", error); // catches any errors
            throw error;
        })
}

function find_stints(url) {
    return fetch(url) // fetches the stints
        .then((response) => {
            if (!response.ok) { // checks the resopnse os ok
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            console.log(data);
            return data; // logs and returns the data to the main function
        })
        .catch(error => {
            console.error("Error fetching session key:", error); // catches any errors
            throw error;
        })
}

function search_strategies(strategies, frequency, strategy) {
    if(strategies.length == 0) { // checks if the array is empty
        return -1;
    } else {
        for(let i=0; i<strategies.length; i++) { // loops from 0 to length of strategies-1
            if(strategies[i] == strategy) { // compares the item in the array to the newest strategy
                return i; // returns the index if it finds a match
            }
        }
        return "new"; // this means it is not already in the array
    }
}



//------------------------------ Data Access ------------------------------//

function set_team(team) {
    localStorage.setItem("team",team); // stores the team locally
    localStorage.setItem("type","constructor") // stores the type as constructor
}

function set_driver(driver) {
    localStorage.setItem("driver",driver); // stores the driver locally
    localStorage.setItem("type","driver") // stores the type as driver
}

function data_option(option) {
    if(option === "team") { // checks which button was selected
        let side_box = document.getElementById("side_box_data") // gets the right element to output to
        side_box.innerHTML = `
        <div class="side_dropdown">
        <button class="dropdown_button">Team/Driver</button>
            <div class="dropdown_content" style="width: 90%;">
                <button onclick="data_option('team')">Team</button>
                <button onclick="data_option('driver')">Driver</button>
            </div>
        </div>
        <div class="side_dropdown">
            <button class="dropdown_button">Team</button>
            <div class="dropdown_content" style="width: 90%;">
                <button onclick="set_team('alpine')">Alpine</button>
                <button onclick="set_team('aston_martin')">Aston Martin</button>
                <button onclick="set_team('ferrari')">Ferrari</button>
                <button onclick="set_team('haas')">Haas</button>
                <button onclick="set_team('mclaren')">McLaren</button>
                <button onclick="set_team('mercedes')">Mercedes</button>
                <button onclick="set_team('red_bull')">RedBull</button>
                <button onclick="set_team('alfa')">Kick Sauber</button>
                <button onclick="set_team('alphatauri')">Racing Bulls</button>
                <button onclick="set_team('williams')">Williams</button>
            </div>
        </div>
        <button class="run_button" onclick="python_api()">Create Graph</button>
        `;
    } else {
        let side_box = document.getElementById("side_box_data") // gets the right element to output to
        side_box.innerHTML = `
        <div class="side_dropdown">
        <button class="dropdown_button">Team/Driver</button>
            <div class="dropdown_content" style="width: 90%;">
                <button onclick="data_option('team')">Team</button>
                <button onclick="data_option('driver')">Driver</button>
            </div>
        </div>
        <div class="side_dropdown">
            <button class="dropdown_button">Driver</button>
            <div class="dropdown_content" style="width: 150%;">
                <div class="column" style="width: 47%;">
                    <button onclick="set_driver('max_verstappen')">Max Verstappen</button>
                    <button onclick="set_driver('leclerc')">Charles Leclerc</button>
                    <button onclick="set_driver('piastri')">Oscar Piastri</button>
                    <button onclick="set_driver('alonso')">Fernando Alonso</button>
                    <button onclick="set_driver('hadjar')">Isack Hadjar</button>
                    <button onclick="set_driver('boroleto')">Gabriel Bortoleto</button>
                    <button onclick="set_driver('hulkenburg')">Nico Hulkenburg</button>
                    <button onclick="set_driver('sainz')">Carlos Sainz</button>
                    <button onclick="set_driver('tsunoda')">Yuki Tsunoda</button>
                    <button onclick="set_driver('bearman')">Oliver Bearman</button>
                </div>
                <div class="column" style="width: 47%;">
                    <button onclick="set_driver('antonelli')">Kimi Antonelli</button>
                    <button onclick="set_driver('hamilton')">Lewis Hamilton</button>
                    <button onclick="set_driver('russell')">George Russell</button>
                    <button onclick="set_driver('albon')">Alex Albon</button>
                    <button onclick="set_driver('lawson')">Liam Lawson</button>
                    <button onclick="set_driver('ocon')">Esteban Ocon</button>
                    <button onclick="set_driver('stroll')">Lance Stroll</button>
                    <button onclick="set_driver('gasly')">Pierre Gasly</button>
                    <button onclick="set_driver('colapinto')">Franco Colapinto</button>
                    <button onclick="set_driver('norizz')">Lando Norris</button>
                </div>
            </div>
        </div>
        <button class="run_button" onclick="python_api()">Create Graph</button>
        `;
    }
}

//-------------Main-Function-------------//
async function python_api() {
    const type = localStorage.getItem("type"); // gets the stored type i.e. constructor or driver
    let subject = null; // creates subject variable
    if (type === "constructor") {
        subject = localStorage.getItem("team"); // makes subhect the selected team
    } else if (type === "driver") {
        subject = localStorage.getItem("driver"); // makes subhect the selected driver
    }

    const mode = localStorage.getItem("stylesheet");
    let theme = null;
    if (mode === "styles_light.css") {
        theme = "light";
    } else if (mode === "styles_dark.css") {
        theme = "dark";
    }

    console.log(type, subject, theme); // logs both type and subject

    const data_to_send = { // creates dictionary (JSON format) with type and subject
        "type": type,
        "subject": subject,
        "theme": theme
    }

    let url = "http://localhost:5001/data";

    let data;
    try {
        data = await call_python(data_to_send, url) // calls the call_python function
    } catch(error) {
        console.error("Error fetching python:", error); // catches any errors
    }
    const graph = document.createElement("img"); // creates graph element
    graph.src = "data:image/png;base64," + data.image; // creates file
    graph.style.height = "90%";
    graph.style.width = "auto";

    clear_info() // calls function to clear the contents of the output box
    document.getElementById("info_output").appendChild(graph); // adds the graph to the page
}

function call_python(dataToSend, url) {
    return fetch(url, { // calls the local host virtual environment
        method: "POST", // sets the methos to POST
        headers: {
            "Content-Type": "application/json" // set the header of the reponse to json format
        },
        body: JSON.stringify(dataToSend) // sets the body/content of the POST request
    })
    .then((response) => {
        if (!response.ok) { // checks the resopnse os ok
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json(); // returns an error to the python_api function
    })
    .then((data) => {
        return data; // returns the response to the python_api function
    })
    .catch(error => {
        console.error("Error fetching session key:", error); // catches any errors
        throw error;
    })
}