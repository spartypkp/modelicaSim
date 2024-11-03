import sys
import os
from pydanticModels import APIParameters, APIUsage
import utilityFunctions as util
import re
import prompts
import json
from pandas import DataFrame
from dataScience import genimg


def generateModelica(name: str, unit: str | None, df: DataFrame, last_run: None | tuple[str, DataFrame], iteration: int) -> str:
    messages = (
        prompts.generate_modelica_first_pass(str(df.describe()), genimg(df, name, unit))
        if last_run is None
        else prompts.generate_modelica_iteration(
            str(df.describe()),
            genimg(df, name, unit, iteration=iteration+1),
            last_run[0],
            str(last_run[1].describe()),
            genimg(last_run[1], name + "_simulation", unit, iteration+1),
        )
    )
    params = APIParameters(
        vendor="anthropic",
        model="claude-3-5-sonnet-20241022",
        messages=messages,
        temperature=0.4,
        max_tokens=4000,
        rag_tokens=0,
    )

    completion_response = util.create_chat_completion(params, insert_usage=False)
    response: str = completion_response[0]

    # Response is an XML string
    # Extract <analysis></analysis> and <modelica_code></modelica_code> into {"analysis": "", "modelica_code": ""}
    # Extract content between XML tags using regex
    analysis_match = re.search(r"<analysis>(.*?)</analysis>", response, re.DOTALL)
    modelica_match = re.search(
        r"<modelica_code>(.*?)</modelica_code>", response, re.DOTALL
    )

    return modelica_match.group(1).strip() if modelica_match else ""


def extract_json(response):
    response = response.replace("\n", "\\n").replace("\r", "\\r")

    json_start = response.index("{")
    json_end = response.rfind("}")
    return json.loads(response[json_start : json_end + 1])
