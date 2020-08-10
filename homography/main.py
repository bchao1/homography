import cv2
import numpy as np
from PIL import Image
import yaml

def parse_configs(file_path):
    orientation = ['top_left', 'top_right', 'bottom_right', 'bottom_left']  # clockwise 
    with open(file_path, 'r') as config:
        data = yaml.load(config)
    corners = []
    for coors in data['coors']:
        vs = [(coors[pos]['x'], coors[pos]['y']) for pos in orientation]
        corners.append(vs)
    return corners, data

def load_project_image(file_path, vs = None):
    img = np.array(Image.open(file_path))
    if not vs:  # used to resize
        return img

    h, w, _ = img.shape
    new_h =  max(int(2 * max(vs[-1][0] - vs[0][0], vs[2][0] - vs[1][0])), h)
    new_w =  max(int(2 * max(vs[1][1] - vs[0][1], vs[2][1] - vs[-1][1])), w)

    img = cv2.resize(img, (new_h, new_w))
    h, w, _ = img.shape

    us = [
        (0, 0),
        (0, w - 1),
        (h - 1, w - 1),
        (h - 1, 0)
    ]
    return img, us

def point_mapping(u, v):
    eq_1 = [u[0], u[1], 1, 0, 0, 0, -u[0]*v[0], -u[1]*v[0], -v[0]]
    eq_2 = [0, 0, 0, u[0], u[1], 1, -u[0]*v[1], -u[1]*v[1], -v[1]]
    return [eq_1, eq_2]

def compute_homography(us, vs):
    assert len(us) == len(vs)
    A = []
    for u, v in zip(us, vs):
        A.extend(point_mapping(u, v))
    A = np.array(A)
    u, s, vt = np.linalg.svd(np.matmul(A.transpose(), A), compute_uv=True, full_matrices=False)
    H = u[:, -1].reshape(3, 3)
    return H

def project(canvas, img, us, vs):
    h, w, _ = img.shape
    H = compute_homography(us, vs)
    u = np.array([[i, j, 1] for i in range(h) for j in range(w)]).T
    v = np.matmul(H, u)
    v[0] /= (v[-1] + 1e-10)
    v[1] /= (v[-1] + 1e-10)
    v = np.round(v).astype(np.int)
    canvas[v[0], v[1], :] = img[u[0], u[1], :]
    return canvas

if __name__ == '__main__':
    corners, configs = parse_configs('config_2.yaml')
    canvas = np.array(Image.open(configs['canvas_image']))
    project_img_paths = configs['project_images']
    assert len(corners) >= len(project_img_paths)

    for vs, file_path in zip(corners, project_img_paths):
        print("Projecting ", file_path)
        img, us = load_project_image(file_path, vs)
        canvas = project(canvas, img, us, vs)
        Image.fromarray(canvas).save(configs['output_image'])