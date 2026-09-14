# PowerPilot 本地开发

项目名称为 PowerPilot，Python 包和启动命令均为 `powerpilot`。
Python 统一在当前项目的 `.conda-env` Conda 环境内执行。

## 安装与启动

在项目目录中运行：

```sh
make install
cp -n .env.example .env
make run
```

`make install` 创建 Python 3.12 Conda 环境并安装开发依赖。
网页入口为 `http://127.0.0.1:8000`，接口文档为 `/docs`，健康检查为 `/api/health`。
`make demo` 与 `make run` 相同；调试热重载可运行 `bash scripts/start_local.sh --reload`。
已有独立 Conda 环境可用 `make install PROJECT_ENV=/absolute/conda/environment` 指定。

## 代码与资源

- `src/powerpilot/`：API、数据校验、确定性优化、独立审计、审批与模拟执行。
- `src/powerpilot/static/`：工作台、能源网络、品牌图形、角色图标和随包提供的 Three.js。
- `src/powerpilot/data/knowledge/`：运行时读取的能源知识内容。
- `data/`：OpenCEM 回放样本、EMSx 原始输入和处理后的 96 点样本。
- `scripts/prepare_emsx_core_fixture.py`：重建 EMSx 样本，通过 `make prepare-data` 执行。
- `agentteams/`：可选外部运行时的 Team/Worker 配置、角色提示词与 Skill 资源。
- `tests/`：API、调度、审计、审批、回放、回退及本地配置测试。

本地页面、合成场景、数据回放和确定性模拟流程使用本地数据。
普通 AI 对话需要自行配置模型；自然语言调度的 Worker 链路还需要独立配置的 AgentTeams 服务。
保留这些接口和资源不代表已验证外部服务连接。未配置时不能将其标记为可用。

## 运行边界

本项目仅用于仿真和决策辅助。`SIMULATION_MODE=true`、`ALLOW_PRODUCTION_WRITE=false`
为强制安全默认值。默认使用本地 SQLite，不连接真实设备或生产数据库。
保持 15 分钟、96 个时间段的默认预测范围。数值计划来自确定性优化器，必须经独立审计。
影响柔性负荷的操作需要人工批准；数据变化后重算、重审并重新批准。
缺失数据或传感器冲突需要人工处理；执行偏差超限时进入保守回退。
密钥仅通过自己的本地运行配置提供，不提交源码、浏览器资源或运行记录。

## 页面结构

运行总览展示当前快照与交互式能源网络；能效分析展示统计和图表；方案与审计承载复核、
人工确认及模拟回执；场景档案提供记录入口。助理与模型设置按需打开。
API 文档在本地读取 `/openapi.json`，不依赖远程脚本或字体。
修改视图时同时检查桌面、小屏、空状态、弹窗及错误页。

## 验证

```sh
make format
make verify
make build
```

`make verify` 包含格式、静态类型和测试检查。`make build` 生成 wheel 安装包。
修改状态转换或安全规则时补充对应测试。当前检查进度见 `STATUS.md`。
安装后的运行数据写入 `var/` 和 `runs/`，这些目录与 `.conda-env/` 均不属于源码。
