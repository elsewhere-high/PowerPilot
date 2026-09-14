# 回放数据

`opencem/2025-07-a.csv` 是原样保留的 OpenCEM 公共测量数据。
SHA-256：`9094f34779cc58046eab3a3ab0bb6a355db5ec0e0fccc254dfae762d0855f907`。
样本由数据适配器聚合为 96 个 15 分钟时间段；电价和生产保护约束由本地回放配置提供。

数据来源：<https://github.com/OpenCEM-platform/opencem-dataset>，CC BY 4.0。
作者：T. S. Bartels, R. Wu, X. Lu, Y. Lu, F. Xia, H. Yang, Y. Chen, T. Li。
文献：Bridging Natural Language and Microgrid Dynamics: A Context-Aware Simulator and Dataset，
2026，arXiv:2604.05429。

`emsx/raw/8.csv.gz` 和 `emsx/raw/metadata.csv` 是样本生成器的输入。
`emsx/processed/emsx_site8_core_upload.csv` 是用于上传回放的处理结果。
执行 `make prepare-data` 可从保留的原始输入重建该处理结果。
