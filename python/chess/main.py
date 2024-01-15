import sys
import cv2
import numpy as np
from stockfish import Stockfish
from board_to_fen.predict import get_fen_from_image_path

def get_best_move(stockfish, fen):
    stockfish.set_fen_position(fen)
    best_move = stockfish.get_best_move()
    return best_move

def rotate_fen(fen):
    fen_parts = fen.split('/')
    reversed_fen_parts = [part[::-1] for part in fen_parts[::-1]]
    rotated_fen = '/'.join(reversed_fen_parts)
    return rotated_fen

def chess_coordinates_to_pixels(move):
    file_map = {'a': 0, 'b': 1, 'c': 2, 'd': 3, 'e': 4, 'f': 5, 'g': 6, 'h': 7}
    rank_map = {'1': 7, '2': 6, '3': 5, '4': 4, '5': 3, '6': 2, '7': 1, '8': 0}
    
    start_square = move[:2]
    end_square = move[2:]
    
    start_pixel = (file_map[start_square[0]] * square_size, rank_map[start_square[1]] * square_size)
    end_pixel = (file_map[end_square[0]] * square_size, rank_map[end_square[1]] * square_size)
    
    return start_pixel, end_pixel

def draw_coordinates(image, coordinates, color=(0, 0, 255), thickness=2):
    cv2.line(image, coordinates[0], coordinates[1], color, thickness)
    return image

input_path = "./python/chess/input.png"
output_path = "./python/chess/output.png"
stockfish = Stockfish("C:/Stockfish/stockfish.exe")
square_size = 100  # Adjust this based on the size of the squares in your chessboard

fen = get_fen_from_image_path(input_path)
if not stockfish.is_fen_valid(fen + " - - - 0 1"):
    sys.exit()

best_move_white = get_best_move(stockfish, fen + " w - - 0 1")
print(best_move_white)

# Load the original image
original_image = cv2.imread(input_path)

# Convert chess coordinates to pixel coordinates
coordinates_white = chess_coordinates_to_pixels(best_move_white)
# Draw a line on the image based on the coordinates of the best move for white
draw_coordinates(original_image, coordinates_white)

# Save the edited image
cv2.imwrite(output_path, original_image)

fen = rotate_fen(fen)

best_move_black = get_best_move(stockfish, fen + " b - - 0 1")
print(best_move_black)

# Load the original image again (as it might have been modified in the previous steps)
original_image = cv2.imread(output_path)

# Convert chess coordinates to pixel coordinates
coordinates_black = chess_coordinates_to_pixels(best_move_black)
# Draw a line on the image based on the coordinates of the best move for black
draw_coordinates(original_image, coordinates_black)

# Save the final edited image
cv2.imwrite(output_path, original_image)
