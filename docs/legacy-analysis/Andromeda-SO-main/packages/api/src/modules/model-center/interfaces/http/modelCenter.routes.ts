import { Router } from "express";
import { ProviderController } from "./ProviderController";
console.log("Registering Model Center Routes...");
import { ModelCatalogController } from "./ModelCatalogController";
import { BenchmarkController } from "./BenchmarkController";
import { RouterMetricsController } from "./RouterMetricsController";
import { RouterConfigController } from "./RouterConfigController";
import { PricingController } from "./PricingController";

const router = Router();
const providerCtrl = new ProviderController();
const modelCtrl = new ModelCatalogController();
const benchmarkCtrl = new BenchmarkController();
const routerCtrl = new RouterMetricsController();
const routerConfigCtrl = new RouterConfigController();
const pricingCtrl = new PricingController();

// Providers
router.post("/providers", providerCtrl.register.bind(providerCtrl));
router.get("/providers", providerCtrl.list.bind(providerCtrl));
router.post("/providers/:id/sync", providerCtrl.syncModels.bind(providerCtrl));
router.post("/providers/:id/pull", providerCtrl.pullModel.bind(providerCtrl));
router.delete("/providers/:id/models/:modelName", providerCtrl.deleteModel.bind(providerCtrl));
router.get("/providers/:id/ps", providerCtrl.listRunningModels.bind(providerCtrl));
router.get("/providers/:id/models/:modelName", providerCtrl.showModelInfo.bind(providerCtrl));
router.post("/providers/:id/models", providerCtrl.createModel.bind(providerCtrl));
router.post("/providers/:id/copy", providerCtrl.copyModel.bind(providerCtrl));

// Models
router.get("/models", modelCtrl.list.bind(modelCtrl));
router.get("/models/:id", modelCtrl.get.bind(modelCtrl));

// Benchmarks
router.post("/benchmarks/run", benchmarkCtrl.run.bind(benchmarkCtrl));
router.get("/models/:modelId/benchmarks", benchmarkCtrl.list.bind(benchmarkCtrl));

// Router Intelligence
router.get("/router/decisions", routerCtrl.getDecisions.bind(routerCtrl));
router.post("/router/simulate", routerCtrl.simulateRoute.bind(routerCtrl));
router.get("/router/config", routerConfigCtrl.get.bind(routerConfigCtrl));
router.put("/router/config", routerConfigCtrl.update.bind(routerConfigCtrl));

// Pricing
router.get("/pricing", pricingCtrl.list.bind(pricingCtrl));
router.put("/pricing/:modelId", pricingCtrl.update.bind(pricingCtrl));

export default router;
