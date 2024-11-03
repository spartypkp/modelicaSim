import utilityFunctions as util
import os
import sys
import base64
from typing import List
from pydanticModels import ChatMessage, Content


DIR = os.path.dirname(os.path.realpath(__file__))
parent = os.path.dirname(DIR)
sys.path.append(parent)


def example() -> List[ChatMessage]:
    system = """
    System Prompt
    """

    user = """
    User prompt
    """
    # Convert the system and user strings to a Messages object
    messages = util.convert_to_messages(user=user, system=system)
    # Get the parameters to call the OpenAI API

    return messages


def generate_modelica_first_pass(
    df_describe: str, image_file_path: str
) -> List[ChatMessage]:
    image_media_type = "image/png"
    image_data = base64.standard_b64encode(open(image_file_path, "rb").read()).decode(
        "utf-8"
    )
    image_source = {
        "type": "base64",
        "media_type": image_media_type,
        "data": image_data,
    }
    image_content = Content(type="image", source=image_source)

    system = """
    You are working at an engineering firm to help understand and simulate industrial systems. You have extensive experience with Modelica, a differential equation programming language and numerical solver for modeling physical systems.

    You are working with some output data from sensors of an industrial machine, which is a time series dataset. This represents the output of the sensors over time.
    The idea here is to create a modelica model that can simulate the machine.

    You will be given the following:
     1. a df.describe() (Python pandas dataframe) string of the data.
     2. an image of the resulting plot of the data.

    You will need to create a modelica model that can simulate the machine, which will consist of a set of numerically solvable differential equations

    Complete this task by following these instructions:
    1. Look at the image paying specific attention to the differential relationships between variables over time
    2. Think, write your analysis of the differential relationships between variables
    3. Generate the modelica code representing the system
    - Variable names used in the model should match the names from the original data frame
    - the model must be named Sys
    - the variable names must match the source dataframe

    You need to return your reasoning/analysis of the provided image and data, and the modelica code you generated in a string. Return this in XML format:
    
    <analysis></analysis>
    <modelica_code></modelica_code>
    """

    user = f"""
    df.describe() output:
    {df_describe}
    """
    # Convert the system and user strings to a Messages object
    messages = util.convert_to_messages(
        user=user, system=system, image_content=image_content
    )
    # Get the parameters to call the OpenAI API

    return messages


def img(path: str):
    return Content(
        type="image",
        source={
            "type": "base64",
            "media_type": "image/png",
            "data": base64.standard_b64encode(open(path, "rb").read()).decode("utf-8"),
        },
    )


def generate_modelica_iteration(
    src_desc: str,
    src_img: str,
    sim_model: str,
    sim_desc: str,
    sim_img: str,
) -> List[ChatMessage]:
    system = """
    You are working at an engineering firm to help understand and simulate industrial systems. You have extensive experience with Modelica, a differential equation programming language and numerical solver for modeling physical systems.

    You are working on writing a set of differential equations in modelica and just finished running a simulation to compare them with the baseline sensor data

    You will be given the following:
     1. a df.describe() (Python pandas dataframe) string of the data.
     2. an image of the resulting plot of the data.
     3. the modelica source code that was tried last
     4. a df.describe string of the simulation results
     5. an image of the simulation results

    You must update the modelica model to make it more accurately model the source data

    Complete this task by following these instructions:
    1. Compare the source data and simulation results
    2. Think, write your analysis of the differential relationships between variables. pay special attention to where the simulated results don't align with the source data
    3. update the modelica model's parameters & equation in order to make it better simulate the source data
    - the model name and variable names shouldn't be changed

    You need to return your reasoning/analysis of the provided image and data, and the modelica code you generated in a string. Return this in XML format:
    
    <analysis></analysis>
    <modelica_code></modelica_code>
    """

    user = f"""
    source df.describe() output:
    {src_desc}

    current model:
    {sim_model}

    sim df.describe() output:
    {sim_desc}
    """
    # Convert the system and user strings to a Messages object
    messages = util.convert_to_messages(
        user=user, system=system, image_content=[img(src_img), img(sim_img)]
    )
    # Get the parameters to call the OpenAI API

    return messages
