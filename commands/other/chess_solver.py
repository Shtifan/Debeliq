from stockfish import Stockfish
from board_to_fen.predict import get_fen_from_image_path
import sys
import cv2
import numpy as np

image_path = "./data/image.png"
stockfish = Stockfish("./commands/other/stockfish.exe")


def crop_chessboard(image_path):
    img = cv2.imread(image_path)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    edges = cv2.Canny(blur, 50, 150)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    contours = sorted(contours, key=cv2.contourArea, reverse=True)

    for contour in contours:
        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * peri, True)

        if len(approx) == 4:
            x, y, w, h = cv2.boundingRect(approx)

            cropped_img = img[y : y + h, x : x + w]

            cv2.imwrite(image_path, cropped_img)
            return


def rotate_fen(fen):
    fen_parts = fen.split("/")
    reversed_fen_parts = [part[::-1] for part in fen_parts[::-1]]
    rotated_fen = "/".join(reversed_fen_parts)
    return rotated_fen


crop_chessboard(image_path)

fen = get_fen_from_image_path(image_path)
if not stockfish.is_fen_valid(fen + " w - - 0 1"):
    sys.exit()

with open("./data/move.txt", "r") as file:
    move_color = file.read().strip()


if move_color == "b":
    fen = rotate_fen(fen)

fen_with_color = fen + f" {move_color} - - 0 1"

stockfish.set_fen_position(fen_with_color)

best_move = stockfish.get_best_move()
print(best_move)
