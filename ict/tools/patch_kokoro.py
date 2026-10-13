"""Expose Kokoro-82M's predicted phoneme durations as a second output named "duration".

kokoro-onnx reports per-phoneme timings only when the graph has that output. The stock
onnx-community export computes the durations internally (Round -> Clip in the encoder) but
does not return them, so this adds a Cast of that tensor to int64 as a graph output.

Usage: python3 ict/tools/patch_kokoro.py <model.onnx> <model-timed.onnx>
"""
import sys

import onnx
from onnx import TensorProto, helper

SRC_TENSOR = '/encoder/Clip_output_0'


def main():
    src, dst = sys.argv[1], sys.argv[2]
    m = onnx.load(src)
    g = m.graph
    if any(o.name == 'duration' for o in g.output):
        raise SystemExit('model already has a duration output')
    if not any(SRC_TENSOR in n.output for n in g.node):
        raise SystemExit(f'{SRC_TENSOR} not found: not the expected Kokoro export')
    g.node.append(helper.make_node('Cast', [SRC_TENSOR], ['duration'], to=TensorProto.INT64, name='expose_duration'))
    g.output.append(helper.make_tensor_value_info('duration', TensorProto.INT64, None))
    onnx.save(m, dst)
    print('wrote', dst)


if __name__ == '__main__':
    main()
