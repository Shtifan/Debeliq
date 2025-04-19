import os

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(ROOT_DIR, "saved_models")
STOCKFISH_PATH = "stockfish"
IMAGE_PATH = r"chessboard.png"
OUTPUT_PATH = r"solved_chessboard_inverted.png"
INVERT_COLORS = True
