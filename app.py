# --------------------- imports --------------------- #

# imports for flask
from flask import Flask, jsonify, request # imports flask
from flask_cors import CORS # imports cors

# imports for graph making
import matplotlib.pyplot as plt
import numpy as np

# imports for file transfer
import io
import base64

# imports for API
import fastf1
from fastf1.ergast import Ergast
ergast = Ergast()


app = Flask(__name__)
CORS(app)


# -------------------- functions -------------------- #

def get_constructor_colour(team):
    if team == "alpine":
        colour = "#F282B4"
    elif team == "aston_martin":
        colour = "#037A68"
    elif team == "haas":
        colour = "#9C9FA2"
    elif team == "ferrari":
        colour = "#ED1131"
    elif team == "mclaren":
        colour = "#F47600"
    elif team == "mercedes":
        colour = "#00D7B6"
    elif team == "red_bull":
        colour = "#003773"
    elif team == "alfa":
        colour = "#53FC18"
    elif team == "alphatauri":
        colour = "#6C98FF"
    elif team == "williams":
        colour = "#1868DB"
    
    return colour


def get_driver_colour(driver):
    if driver == "colapinto" or driver == "gasly":
        colour = "#F282B4"
    elif driver == "stroll" or driver == "alonso":
        colour = "#037A68"
    elif driver == "bearman" or driver == "ocon":
        colour = "#9C9FA2"
    elif driver == "leclerc" or driver == "hamilton":
        colour = "#ED1131"
    elif driver == "piastri" or driver == "norris":
        colour = "#F47600"
    elif driver == "russell" or driver == "antonelli":
        colour = "#00D7B6"
    elif driver == "max_verstappen" or driver == "tsunoda":
        colour = "#003773"
    elif driver == "hulkenburg" or driver == "bortoleto":
        colour = "#53FC18"
    elif driver == "hadjar" or driver == "lawson":
        colour = "#6C98FF"
    elif driver == "sainz" or driver == "albon":
        colour = "#1868DB"
    
    return colour


def create_strat_graph(strategies, lengths, theme):
    fig, ax = plt.subplots()

    count2 = -1
    for strat in strategies:
        count2 += 1
        count = -1
        previous_end = 0
        for stint in strat:
            stint_length = 0
            count += 1
            stint_length += lengths[count2][count]
            
            if stint == "S":
                colour = "#e61c1d"
            elif stint == "M":
                colour = "#e6b741"
            elif stint == "H":
                colour = "#fdfdfd"
            elif stint == "I":
                colour = "#0c8629"
            elif stint == "W":
                colour = "#125a7f"

            if theme == "light":
                plt.barh(
                    y = strat,
                    width = stint_length,
                    height = 0.4,
                    left = previous_end,
                    color = colour,
                    edgecolor = "black",
                    fill = True
                )
            elif theme == "dark":
                plt.barh(
                    y = strat,
                    width = stint_length,
                    height = 0.4,
                    left = previous_end,
                    color = colour,
                    edgecolor = "white",
                    fill = True
                )

            previous_end += stint_length

    plt.xlabel("Lap Number")
    plt.grid(False)
    ax.invert_yaxis()

    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)
    ax.spines['left'].set_visible(False)

    if theme == "dark":
        ax.spines['bottom'].set_color("#FFFFFF")
        ax.set_xlabel("Year", color="#FFFFFF") # sets lable to white
        ax.set_ylabel("Position", color="#FFFFFF") # sets lable to white
        ax.tick_params(axis='x', colors="#FFFFFF") # sets ticks to white
        ax.tick_params(axis='y', colors="#FFFFFF") # sets ticks to white
        fig.patch.set_facecolor("#262626") # sets background to dark grey
        fig.gca().set_facecolor("#262626") # sets background to dark grey

    plt.tight_layout()
    
    return fig


def sort_arrays(strategies, frequency, lengths):
    n = len(frequency) # gets the length of the arrays
    for i in range(1,n): # loops through the 1 to the length
        index = i
        current_freq = frequency[i] # gets a value in the list frequency
        current_strat = strategies[i] # gets a value in the list strategies
        current_len = lengths[i] # gets a value in the list lengths
        for j in range(i-1, -1, -1):
            if frequency[j] > current_freq: #checks the values against the current one
                frequency[j+1] = frequency[j] #swaps the values in frequency
                strategies[j+1] = strategies[j] #swaps the values in strategies
                lengths[j+1] = lengths[j] #swaps the values in lengths
                index = j
            else:
                break
            frequency[index] = current_freq
            strategies[index] = current_strat
            lengths[index] = current_len

    return strategies, frequency, lengths


def create_graph(positions, type, theme, colour):
    fig, ax = plt.subplots() # creates graph
    ax.plot([2018,2019,2020,2021,2022,2023,2024], positions, marker="o", color=colour) # plots positions
    ax.invert_yaxis() # makes the axis have lower numbers at the top

    if type == "constructor":
        ax.set_ylim(10,1) # to make sure the entire range is displayed
        ax.set_yticks(range(1,10)) # to only include the round numbers as markers
    elif type == "driver":
        ax.set_ylim(20,1) # to make sure the entire range is displayed
        ax.set_yticks(range(1,20)) # to only include the round numbers as markers

    if theme == "light":
        ax.grid(True, linestyle='-', alpha=1, color="#BFBFBF") # adds grid for visability
        ax.set_xlabel("Year")
        ax.set_ylabel("Position")
    elif theme == "dark":
        ax.grid(True, linestyle='-', alpha=1, color="#3A3A3A") # adds grid for visability
        ax.set_xlabel("Year", color="#FFFFFF") # sets lable to white
        ax.set_ylabel("Position", color="#FFFFFF") # sets lable to white
        fig.patch.set_facecolor("#262626") # sets background to dark grey
        fig.gca().set_facecolor("#262626") # sets background to dark grey
        ax.spines['bottom'].set_color("#FFFFFF") # sets axis to white
        ax.spines['top'].set_color("#FFFFFF") # sets axis to white
        ax.spines['right'].set_color("#FFFFFF") # sets axis to white
        ax.spines['left'].set_color("#FFFFFF") # sets axis to white
        ax.tick_params(axis='x', colors="#FFFFFF") # sets ticks to white
        ax.tick_params(axis='y', colors="#FFFFFF") # sets ticks to white

    return fig


def fetch_WCC(year, subject):
    response = ergast.get_constructor_standings(season=year, result_type='raw') # calls the ergast api and stores the response
    standings = response[0] # gets the response out of the array

    pos = None # creates the position variable
    constructorStandings = standings["ConstructorStandings"] # gets the nested dictionary from standings
    for team in constructorStandings: # loops through the tams in the standings
        if team["Constructor"]["constructorId"] == subject: # chechs the constructor id to the desired team
            pos = int(team["position"]) # gets said teams position

    return pos # returns the position


def fetch_WDC(year, subject):
    response = ergast.get_driver_standings(season=year, result_type='raw') # calls the ergast api and stores the response
    standings = response[0] # gets the response out of the array

    pos = None # creates the position variable
    driverStandings = standings["DriverStandings"] # gets the nested dictionary from standings
    for driver in driverStandings: # loops through the tams in the standings
        if driver["Driver"]["driverId"] == subject: # chechs the constructor id to the desired team
            pos = int(driver["position"]) # gets said teams position

    return pos # returns the position


@app.route('/data', methods=['GET','POST'])
def call_api():
    data = request.get_json() #gets the POST request
    if not data:
        return jsonify({"error": "No JSON data received"}), 400 # catches any errors
    
    print(data.get("type"),data.get("subject"),data.get("theme")) # prints the type, subject and theme

    if data.get("type") == "constructor":
        colour = get_constructor_colour(data.get("subject"))
        print(colour)
        posistions = [] # creates an array for the finishing positions for the championship
        for year in range (2018,2025): # loops from the year 2018 to now
            print("debug")
            pos = fetch_WCC(year, data.get("subject")) # calls the fetch function and stores the result
            posistions.append(pos) # adds pos to the array
        print(posistions) # prints the array
    elif data.get("type") == "driver":
        colour = get_driver_colour(data.get("subject"))
        posistions = [] # creates an array for the finishing positions for the championship
        for year in range (2018,2025): # loops from the year 2018 to now
            pos = fetch_WDC(year, data.get("subject")) # calls the fetch function and stores the result
            posistions.append(pos) # adds pos to the array
        print(posistions) # prints the array

    fig = create_graph(posistions, data.get("type"), data.get("theme"), colour) # calls the function to create the graph

    # save it to a bytes buffer
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    buf.seek(0)
    plt.close(fig)

    # encode to base64 string
    img_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    return jsonify({"image": img_base64}) # will return to the script that called the file


@app.route('/strategy', methods=['GET','POST'])
def strat_graph():
    data = request.get_json() #gets the POST request
    if not data:
        return jsonify({"error": "No JSON data received"}), 400 # catches any errors

    # make graph here
    strategies = data.get("strategies")
    frequency = data.get("frequency")
    lengths = data.get("lengths")
    theme = data.get("theme")

    strategies, frequency, lengths = sort_arrays(strategies, frequency, lengths)
    print(strategies, frequency, lengths)
    fig = create_strat_graph(strategies, lengths, theme)

    # save it to a bytes buffer
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    buf.seek(0)
    plt.close(fig)

    # encode to base64 string
    img_base64 = base64.b64encode(buf.getvalue()).decode("utf-8")

    return jsonify({"image": img_base64}) # will return to the script that called the file


if __name__ == '__main__':
    app.run(port=5001) # runs the app function and uses port 5001