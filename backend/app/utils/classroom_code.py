import random
import string

def generate_classroom_code(length: int = 6):
    chars = string.ascii_uppercase + string.digits
    return "".join(random.choice(chars) for _ in range(length))
