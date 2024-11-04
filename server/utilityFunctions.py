import tiktoken
import os
import concurrent.futures
from typing import Optional, List, Any, Callable, Tuple, Type, Union
from openai import OpenAI
from anthropic import Anthropic
import instructor
from pydantic import BaseModel
from pydanticModels import APIParameters, ChatMessage, APIUsage, Content
from datetime import datetime
import time
import math
from dotenv import load_dotenv
import uuid

DIR = os.path.dirname(os.path.realpath(__file__))


# ==== Set API Keys ====
load_dotenv()
api_key_openai_name = "Personal Key"
openai_client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
)
api_key_anthropic_name = "Personal Key"
anthropic_client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


instructor_openai_client = instructor.from_openai(
    OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
)
instructor_anthropic_client = instructor.from_anthropic(
    Anthropic(api_key=os.getenv("OPENAI_API_KEY"))
)


def main():
    pass


def convert_to_messages(
    user: str, system: str, image_content=None
) -> List[ChatMessage]:
    messages = []
    messages.append(ChatMessage(role="system", content=system))

    # Fix for image content handling
    if image_content:
        # If image_content is a Content object, use it directly
        if isinstance(image_content, Content):
            messages.append(ChatMessage(role="user", content=[image_content]))
        # If it's a dict, convert it to a Content object first
        elif isinstance(image_content, dict):
            content_obj = Content(**image_content)
            messages.append(ChatMessage(role="user", content=[content_obj]))

    messages.append(ChatMessage(role="user", content=user))
    return messages


def create_chat_completion(
    params: APIParameters, user: Optional[str] = None, insert_usage: bool = True
) -> Tuple[Union[str, Type[BaseModel]], APIUsage]:
    """
    Routes the chat completion request to the appropriate vendor's API based on the vendor specified in the parameters.

    Args:
        params (APIParameters): The parameters for the API call as the APIParameters Pydantic Model.
        user (str, optional): The requesting user's DB name. Defaults to None.
        insert_usage (bool, optional): Flag to determine if usage data should be inserted. Defaults to True.

    Raises:
        ValueError: If an unsupported vendor is provided or if user is not provided when insert_usage is True.

    Returns:
        Tuple[str, APIUsage]: The chat completion response and usage data.
    """
    if params.vendor.lower() == "openai":
        response_tuple = create_chat_completion_openai(params)
    elif "instructor/" in params.vendor.lower():
        response_tuple = create_chat_completion_instructor(params)
    elif params.vendor.lower() == "anthropic":
        response_tuple = create_chat_completetion_anthropic(params)
    else:
        raise ValueError("Unsupported vendor")

    if insert_usage:
        if user is None:
            raise ValueError("User must be provided to insert usage data!")
        response_tuple[1].insert(user=user)
    return response_tuple


def create_chat_completion_openai(params: APIParameters) -> Tuple[str, APIUsage]:
    """
    Calls the OpenAI ChatCompletion API and returns the completion message and usage data.

    Args:
        params (APIParameters): The parameters for the API call as the APIParameters Pydantic Model.

    Returns:
        Tuple[str, APIUsage]: The chat completion response and usage data.
    """
    start = time.time()
    try:
        # Additional check for response_format presence
        response_format = params.response_format or None

        completion = openai_client.chat.completions.create(
            model=params.model,
            messages=params.messages,
            temperature=params.temperature,
            top_p=params.top_p,
            frequency_penalty=params.frequency_penalty,
            presence_penalty=params.presence_penalty,
            stream=params.stream,
            response_format=response_format,  # Use response_format if provided
        )

        if not completion:
            raise Exception(f"OpenAI API call failed with status: {completion}")

        status = 200
        response_id = completion.id
        error_message = None
        duration = time.time() - start
        content: str = completion.choices[0].message.content

        usage = completion.usage

        input_tokens = usage.prompt_tokens
        output_tokens = usage.completion_tokens
        total_tokens = usage.total_tokens

    except Exception as error:
        print(f"Error: {error}")
        status = 400
        error_message = str(error)
        duration = None
        content = None
        input_tokens, output_tokens, total_tokens = None, None, None
        response_id = None

    usage = APIUsage(
        model=params.model,
        vendor=params.vendor,
        response_id=response_id,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        total_tokens=total_tokens,
        request_status=status,
        error_message=error_message,
        calling_function=params.calling_function,
        timestamp=datetime.now(),
        duration=duration,
        api_key_name=api_key_openai_name,
        rag_tokens=params.rag_tokens,
    )

    return content, usage


# Calls the Anthropic ChatCompletion API and returns the completion message
def create_chat_completetion_anthropic(params: APIParameters) -> Tuple[str, APIUsage]:
    """
    Calls the Anthropic ChatCompletion API and returns the completion message and usage data.

    Args:
        params (APIParameters): The parameters for the API call as the APIParameters Pydantic Model.

    Returns:
        Tuple[str, APIUsage]: The chat completion response and usage data.
    """
    start = time.time()

    try:
        if params.messages[0].role != "system":
            system = None
        else:
            system = params.messages.pop(0).content
        real_messages = []

        for msg in params.messages:
            real_messages.append(msg.model_dump())
        # real_messages.append({"role": "assistant", "content": "{"})

        completion = anthropic_client.messages.create(
            model=params.model,
            system=system,
            max_tokens=params.max_tokens,
            stream=params.stream,
            temperature=params.temperature,
            top_p=params.top_p,
            messages=real_messages,
        )
        if not completion:
            raise Exception(f"Anthropic API call failed with status: {completion}")

        usage = completion.usage
        print(usage)
        input_tokens = usage.input_tokens
        output_tokens = usage.output_tokens
        total_tokens = input_tokens + output_tokens

        status = 200
        error_message = None
        duration = time.time() - start
        content = completion.content
        # print(content)
        content = content[0].text
        # print(content)
        response_id = completion.id

    except Exception as error:
        status = 400
        error_message = str(error)
        print(f"Error: {error}")
        duration = None
        content = None
        response_id = f"ERROR-{str(uuid.uuid4())}"
        input_tokens, output_tokens, total_tokens = None, None, None

    usage = APIUsage(
        model=params.model,
        vendor=params.vendor,
        response_id=response_id,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        total_tokens=total_tokens,
        request_status=status,
        error_message=error_message,
        calling_function=params.calling_function,
        timestamp=datetime.now(),
        duration=duration,
        api_key_name=api_key_openai_name,
        rag_tokens=params.rag_tokens,
    )

    return content, usage


# Calls the Instructor ChatCompletion API and returns the completion message and usage data
def create_chat_completion_instructor(
    params: APIParameters,
) -> Tuple[Type[BaseModel], APIUsage]:
    """
    Calls the Instructor ChatCompletion API and returns the completion message and usage data.

    Args:
        params (APIParameters): The parameters for the API call as the APIParameters Pydantic Model.

    Returns:
        Tuple[str, APIUsage]: The chat completion response and usage data.
    """
    start = time.time()
    actual_vendor = params.vendor.split("/")[1].lower()
    params.vendor = actual_vendor

    try:
        if params.vendor == "openai":
            completion: Type[BaseModel] = (
                instructor_openai_client.chat.completions.create(
                    model=params.model,
                    response_model=params.response_model,
                    max_retries=params.max_retries,
                    messages=params.messages,
                    temperature=params.temperature,
                    top_p=params.top_p,
                    frequency_penalty=params.frequency_penalty,
                    presence_penalty=params.presence_penalty,
                    stream=params.stream,
                )
            )
        elif params.vendor == "anthropic":
            if params.messages[0].role != "system":
                system = None
            else:
                system = params.messages.pop(0).content
            real_messages = []

            for msg in params.messages:
                real_messages.append(msg.model_dump())

            completion: Type[BaseModel] = instructor_anthropic_client.messages.create(
                model=params.model,
                system=system,
                response_model=params.response_model,
                max_retries=params.max_retries,
                messages=real_messages,
                temperature=params.temperature,
                top_p=params.top_p,
                stream=params.stream,
                max_tokens=params.max_tokens,
            )
        else:
            raise ValueError(f"Unsuppoprted vendor for instructor!")

            # completion: Type[BaseModel] = instructor_anthropic_client(
            #     model=params.model,
            #     max_tokens=params.max_tokens,
            #     max_retries=params.max_retries,
            #     messages=params.messages,
            #     response_model=params.response_model,
            # )  # type: ignore

        # Additional check for response_format presence

        if not completion:
            raise Exception(
                f"Instructor {params.vendor} API call failed with status: {completion}"
            )

        status = 200
        response_id = completion._raw_response.id
        error_message = None
        duration = time.time() - start

        usage = completion._raw_response.usage

        input_tokens = usage.prompt_tokens
        output_tokens = usage.completion_tokens
        total_tokens = usage.total_tokens

    except Exception as error:
        print(f"Error: {error}")
        status = 400
        error_message = str(error)
        duration = None

        input_tokens, output_tokens, total_tokens = None, None, None
        response_id = f"ERROR-{str(uuid.uuid4())}"

    usage = APIUsage(
        model=params.model,
        vendor=params.vendor,
        response_id=response_id,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        total_tokens=total_tokens,
        request_status=status,
        error_message=error_message,
        calling_function=params.calling_function,
        timestamp=datetime.now(),
        duration=duration,
        api_key_name=api_key_openai_name,
        rag_tokens=params.rag_tokens,
    )

    return completion, usage


# ===== Cost Estimation Functions =====
def anthropic_estimate_tokens(prompt) -> int:
    """Returns the number of tokens in a text string."""
    count = anthropic_client.count_tokens(prompt)
    return count


def openai_estimate_tokens(string) -> int:
    """Returns the number of tokens in a text string."""
    encoding = tiktoken.get_encoding("cl100k_base")
    num_tokens = len(encoding.encode(string))
    return num_tokens


# ===== Async & Concurrent Functions =====
def run_concurrently(
    main_func: Callable,
    args_list: List[Any],
    batch_size: int,
    wait_time: Optional[int] = None,
):
    """
    Concurrently runs a function with a list of arguments in batches.
    Args:
        main_func (Callable): The function to run.
        args_list (List[Any]): The list of arguments to use for the function.
        batch_size (int): The number of arguments to include in each batch.
    Returns:
        List[Any]: The results of the function calls.
    """
    total_batches = math.ceil(len(args_list) / batch_size)
    print(
        f"=== Running {main_func.__name__} for {total_batches} batches of {batch_size} ==="
    )
    results = []
    for i in range(0, len(args_list), batch_size):
        batch = args_list[i : i + batch_size]
        with concurrent.futures.ThreadPoolExecutor() as executor:
            futures = [executor.submit(main_func, *args) for args in batch]
        results.extend([future.result() for future in futures])
        print(
            f"=== Batch {int((i+batch_size)/batch_size)}/{total_batches} completed ==="
        )
        if wait_time:
            time.sleep(wait_time)

    return results


if __name__ == "__main__":
    main()
