#!/usr/bin/env python3

from sim import sim
from dataScience import load_json
from generateModelica import generateModelica
import pandas as pd


def run_modelica_pipeline(filePath: str):
    name, unit, df = load_json(filePath)
    simres = None
    iteration_limit = 2
    for i in range(0, iteration_limit):
        modelica_code = generateModelica(name, unit, df, simres, i)
        print(modelica_code)
        is_success, simdf = sim(modelica_code, df)
        simres = (modelica_code, simdf)
        if is_success:
            print(f"Success on iteration {i}")
            break
        else:
            print(f"Failure on iteration {i}")




