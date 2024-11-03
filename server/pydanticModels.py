
from pydantic import BaseModel, Field, HttpUrl
from pydantic.types import conlist, Json
from pydantic import BaseModel, validator, ValidationError, model_validator, field_validator, field_serializer, model_serializer, computed_field, ValidationError,ValidationInfo
import json
from typing import Any, Dict, List, Optional, Union, Tuple, Type
from functools import wraps
import datetime
import re
import inspect
from enum import Enum
import xml.etree.ElementTree as ET

pricing_data = {
    "anthropic": {
      "claude-3-opus-20240229": {
        "input_price": "15.00",
        "output_price": "75.00",
        "context_window": 200000,
        "RPM": 2000,
        "TPM": 100000
      },
      "claude-3-5-sonnet-20241022": {
        "input_price": "3.00",
        "output_price": "15.00",
        "context_window": 200000,
        "RPM": 2000,
        "TPM": 100000
      },
      "claude-3-haiku-20240307": {
        "input_price": "0.25",
        "output_price": "1.25",
        "context_window": 200000,
        "RPM": 2000,
        "TPM": 100000
      }
    },
    "openai": {
        "gpt-4o": {
      "input_price": "2.50",
      "output_price": "10.00",
      "TPM": 30000000,
      "RPM": 10000,
      "context_window": 128000
    },
      "gpt-4-turbo": {
        "input_price": "10.00",
        "output_price": "30.00",
        "TPM": 800000,
        "RPM": 10000,
        "context_window": 128000
      },
      "gpt-4-0125-preview": {
        "input_price": "10.00",
        "output_price": "30.00",
        "TPM": 800000,
        "RPM": 10000,
        "context_window": 128000
      },
      "gpt-4-1106-preview": {
        "input_price": "10.00",
        "output_price": "30.00",
        "TPM": 800000,
        "RPM": 10000,
        "context_window": 128000
      },
      "gpt-4-1106-vision-preview": {
        "input_price": "10.00",
        "output_price": "30.00",
        "TPM": 150000,
        "RPM": 300000
      },
      "gpt-4": {
        "input_price": "30.00",
        "output_price": "60.00",
        "TPM": 300000,
        "RPM": 10000,
        "context_window": 8192
      },
      "gpt-4-32k": {
        "input_price": "60.00",
        "output_price": "120.00"
      },
      "gpt-3.5-turbo": {
        "input_price": "0.50",
        "output_price": "1.50",
        "TPM": 1000000,
        "RPM": 10000,
        "context_window": 16385
      },
      "gpt-3.5-turbo-0125": {
        "input_price": "0.50",
        "output_price": "1.50",
        "TPM": 1000000,
        "RPM": 10000,
        "context_window": 16385
      },
      "gpt-3.5-turbo-1106": {
        "input_price": "1.00",
        "output_price": "2.00",
        "TPM": 1000000,
        "RPM": 10000,
        "context_window": 16385
      },
      "gpt-3.5-turbo-0301": {
        "input_price": "1.50",
        "output_price": "2.00",
        "TPM": 1000000,
        "RPM": 10000
      },
      "gpt-3.5-turbo-0613": {
        "input_price": "1.50",
        "output_price": "2.00",
        "TPM": 1000000,
        "RPM": 10000
      },
      "gpt-3.5-turbo-instruct": {
        "input_price": "1.50",
        "output_price": "2.00",
        "TPM": 90000,
        "RPM": 3500,
        "context_window": 4096
      },
      "gpt-3.5-turbo-16k": {
        "input_price": "3.00",
        "output_price": "4.00",
        "TPM": 1000000,
        "RPM": 10000,
        "context_window": 16385
      },
      "gpt-3.5-turbo-16k-0613": {
        "input_price": "3.00",
        "output_price": "4.00",
        "TPM": 1000000,
        "RPM": 10000,
        "context_window": 16385
      },
      "text-embedding-3-small": {
        "input_price": "0.02",
        "output_price": "",
        "TPM": 5000000,
        "RPM": 10000
      },
      "text-embedding-3-large": {
        "input_price": "0.13",
        "output_price": "",
        "TPM": 5000000,
        "RPM": 10000
      },
      "text-embedding-ada-002": {
        "input_price": "0.10",
        "output_price": "",
        "TPM": 5000000,
        "RPM": 10000
      },
      "davinci-002": {
        "input_price": "12.00",
        "output_price": "12.00",
        "TPM": 250000,
        "RPM": 3000,
        "context_window": 16384
      },
      "babbage-002": {
        "input_price": "1.60",
        "output_price": "1.60",
        "TPM": 250000,
        "RPM": 3000,
        "context_window": 16384
      }
    }
  }

import anthropic
import base64
import httpx

# image_url = "https://upload.wikimedia.org/wikipedia/commons/a/a7/Camponotus_flavomarginatus_ant.jpg"
# image_media_type = "image/jpeg"
# image_data = base64.standard_b64encode(httpx.get(image_url).content).decode("utf-8")

# message = anthropic.Anthropic().messages.create(
#     model="claude-3-5-sonnet-20241022",
#     max_tokens=1024,
#     messages=[
#         {
#             "role": "user",
#             "content": [
#                 {
#                     "type": "image",
#                     "source": {
#                         "type": "base64",
#                         "media_type": image_media_type,
#                         "data": image_data,
#                     },
#                 }
#             ],
#         }
#     ],
# )
# print(message)

# ===== API Models =====
class Content(BaseModel):
    type: str
    source: Dict[str, Any]

class ChatMessage(BaseModel):
    role: str
    content: Union[str, List[Union[str, Content]]]

class APIParameters(BaseModel):
    # Common parameters
    vendor: str
    model: str
    messages: List[ChatMessage]
    temperature: float = Field(1, le=1, gt=0)
    top_p: Optional[float] = Field(1, le=1, gt=0)
    frequency_penalty: float = Field(0, le=1, ge=0)
    max_tokens: Optional[int] = None  # Anthropic specific
    stream: Optional[bool] = False

    # OpenAI Specific
    response_format: Optional[Dict[str, Any]] = None
    presence_penalty: float = Field(0, le=1, ge=0)
    # Instructor specific
    response_model: Optional[Type[BaseModel]] = None  # Instructor specific
    max_retries: Optional[int] = Field(default=1)  # Instructor specific
    # Anthropic specific:
    stop_sequences: Optional[List[str]] = Field(default=None)

    # Metadata for cost analysis and logging
    calling_function: Optional[str] = None
    rag_tokens: int = Field(..., description="Number of RAG tokens")

    
    @model_validator(mode="before")
    def set_calling_function(cls, values):
        # If calling_function is not already set, determine it dynamically
        if 'calling_function' not in values or values['calling_function'] is None:
            values['calling_function'] = inspect.stack()[2].function
        return values

class APIUsage(BaseModel):
    response_id: str = Field(..., description="Unique identifier for the record. Primary key.")
    session_id: Optional[str] = Field(default=None, description="Unique identifier for the session.")
    calling_function: str = Field(..., description="Name of the Python function that initiated the request")
    vendor: str = Field(..., description="The vendor used for the request")
    model: str = Field(..., description="The LLM model used for the request")
    
    
    input_tokens: Optional[int] = Field(..., description="Number of prompt tokens")
    rag_tokens: Optional[int] = Field(..., description="Number of RAG tokens")
    output_tokens: Optional[int] = Field(..., description="Number of completion tokens")
    total_tokens: Optional[int] = Field(..., description="Total number of tokens used in the request")

    input_cost: Optional[float] = None
    rag_cost: Optional[float] = None
    output_cost: Optional[float] = None
    total_cost: Optional[float] = None

    request_status: Optional[int] = Field(None, description="Status of the API request")
    error_message: Optional[str] = Field(None, description="Error message if the request failed")
    duration: Optional[float] = Field(None, description="Duration of the API request in seconds")

    api_key_name: Optional[str] = Field(None, description="Name of the API key used for the request")
    timestamp: datetime.datetime = Field(default=None, description="Timestamp of the API request")

    # @model_validator(mode='after')
    # def compute_cost(self) -> 'APIUsage':
    #     # Don't recompute if the cost is already set
    #     if self.total_cost is not None:
    #         return self
    #     # Open the JSON file and load pricing data
    #     # with open("src.utils.api_pricing.json", "r") as file:
    #     #     pricing_data = json.load(file)
        
    #     # Access the vendor and model specific pricing information
    #     try:
    #         model_pricing = pricing_data[self.vendor][self.model]
    #     except KeyError:
    #         return self
    #         raise ValueError(f"Pricing data not found for model {self.model} and vendor {self.vendor}")
        
    #     # Calculate costs
    #     self.input_cost = (self.input_tokens / 1e6) * float(model_pricing["input_price"])
    #     self.output_cost = (self.output_tokens / 1e6) * float(model_pricing["output_price"])
    #     self.total_cost = self.input_cost + self.output_cost
    #     return self
    
    






def main():
    # test_link = "https://www.ecfr.gov/current/title-40/part-205/subpart-s"
    # analyze_partial_link(test_link, "will2")
    pass
    # test_id = "us/federal/ecfr/title=7/subtitle=B/chapter=XI/part=1219/subpart=A/subject-group=ECFR70215de6cdda424/section=1219.54"
    # sql_select = f"SELECT * FROM us_federal_ecfr WHERE id = '{test_id}';"
    # row: Node = util.pydantic_select(sql_select, classType=Node, user="will2")[0]
    # all_definitions = fetch_definitions("will2", node_id=test_id)
    

    # definition_dict = all_definitions[0][1]
    # with open("test_definitions.json", "w") as file:
    #     json.dump(definition_dict, file, indent=4)
    # file.close()
    # node_text = row.node_text.to_list_text()

    # print(f"Node Text: {node_text}")
    # filtered_definitions = filter_definitions_from_node_text(node_text, definition_dict)
    
    # print(f"Filtered Definitions: {filtered_definitions.keys()}")





ALLOWED_LEVELS = [
    "title",
    "subtitle",
    "code",
    "part",
    "subpart",
    "division",
    "subdivision",
    "article",
    "subarticle",
    "chapter",
    "subchapter",
    "subject-group",
    "section",
    "appendix",
    "hub"
]

if __name__ == "__main__":
    main()


