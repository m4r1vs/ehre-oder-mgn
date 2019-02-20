import os
from bottle import route, request, static_file, run

import json
import base64

import numpy as np
import tensorflow as tf

PATH = os.path.dirname(os.path.realpath(__file__))

def load_graph(model_file):
    graph = tf.Graph()
    graph_def = tf.GraphDef()

    with open(model_file, "rb") as f:
        graph_def.ParseFromString(f.read())
    with graph.as_default():
        tf.import_graph_def(graph_def)

    return graph

def read_tensor_from_image_file(file_base64, input_height=299, input_width=299, input_mean=0, input_std=255):
    file_decoded = base64.b64decode(file_base64)
    image_reader = tf.image.decode_image(file_decoded, channels = 3, name='jpeg_reader')
    float_caster = tf.cast(image_reader, tf.float32)
    dims_expander = tf.expand_dims(float_caster, 0)
    resized = tf.image.resize_bilinear(dims_expander, [input_height, input_width])
    normalized = tf.divide(tf.subtract(resized, [input_mean]), [input_std])
    sess = tf.Session()
    result = sess.run(normalized)

    return result

def load_labels(label_file):
    label = []
    proto_as_ascii_lines = tf.gfile.GFile(label_file).readlines()
    for l in proto_as_ascii_lines:
        label.append(l.rstrip())
    return label

model_file = "{}/graph.pb".format(PATH)
label_file = "{}/labels.txt".format(PATH)

input_height = 299
input_width = 299
input_mean = 0
input_std = 255
input_layer = "Mul"
output_layer = "final_result"

graph = load_graph(model_file)

@route('/ehre-oder-mgn/')
def root():
    return static_file('{}/index.html'.format(PATH), root='/')

@route('/ehre-oder-mgn/upload', method='POST')
def do_upload():

    t = read_tensor_from_image_file(
        request.body.read(),
        input_height=input_height,
        input_width=input_width,
        input_mean=input_mean,
        input_std=input_std
    )

    input_name = "import/" + input_layer
    output_name = "import/" + output_layer
    input_operation = graph.get_operation_by_name(input_name)
    output_operation = graph.get_operation_by_name(output_name)

    with tf.Session(graph=graph) as sess:
        results = sess.run(output_operation.outputs[0], {input_operation.outputs[0]: t})

    results = np.squeeze(results)

    top_k = results.argsort()[-5:][::-1]
    labels = load_labels(label_file)

    result = {}

    for i in top_k:
        result[labels[i]] = "{}".format(results[i])

    return json.dumps(result)

if __name__ == "__main__":
    run(host='0.0.0.0', port=8888, reloader=True)