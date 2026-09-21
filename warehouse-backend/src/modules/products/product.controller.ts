import { Request, Response, NextFunction } from "express";
import * as productService from "./product.service";
import { recordAuditEvent } from "@/modules/audit/audit.service";

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.createProduct({
      ...req.body,
      createdBy: req.currentUser!.id,
    });

    await recordAuditEvent({
      eventType: "PRODUCT_CREATED",
      actorUserId: req.currentUser!.id,
      actorRole: req.currentUser!.role,
      targetType: "Product",
      targetId: product._id.toString(),
      ip: req.ip,
      metadata: { sku: product.sku },
    });

    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);

    await recordAuditEvent({
      eventType: "PRODUCT_UPDATED",
      actorUserId: req.currentUser!.id,
      actorRole: req.currentUser!.role,
      targetType: "Product",
      targetId: product._id.toString(),
      ip: req.ip,
    });

    res.json({ product });
  } catch (err) {
    next(err);
  }
}

export async function archive(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.archiveProduct(
      req.params.id,
      req.currentUser!.id
    );

    await recordAuditEvent({
      eventType: "PRODUCT_ARCHIVED",
      actorUserId: req.currentUser!.id,
      actorRole: req.currentUser!.role,
      targetType: "Product",
      targetId: product._id.toString(),
      ip: req.ip,
      metadata: { sku: product.sku },
    });

    res.json({ product });
  } catch (err) {
    next(err);
  }
}

export async function restore(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.restoreProduct(req.params.id);

    await recordAuditEvent({
      eventType: "PRODUCT_RESTORED",
      actorUserId: req.currentUser!.id,
      actorRole: req.currentUser!.role,
      targetType: "Product",
      targetId: product._id.toString(),
      ip: req.ip,
      metadata: { sku: product.sku },
    });

    res.json({ product });
  } catch (err) {
    next(err);
  }
}

export async function deletePermanently(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const product = await productService.deleteProductPermanently(
      req.params.id
    );

    await recordAuditEvent({
      eventType: "PRODUCT_PERMANENTLY_DELETED",
      actorUserId: req.currentUser!.id,
      actorRole: req.currentUser!.role,
      targetType: "Product",
      targetId: product._id.toString(),
      ip: req.ip,
      metadata: { sku: product.sku },
    });

    res.json({
      status: "ok",
      message: "Product permanently deleted.",
    });
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await productService.getProductById(req.params.id);
    res.json({ product });
  } catch (err) {
    next(err);
  }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (
      req as Request & {
        validatedQuery: Parameters<typeof productService.listProducts>[0];
      }
    ).validatedQuery;

    const result = await productService.listProducts(query);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function dashboardCounts(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const counts = await productService.getDashboardCounts();
    res.json({ counts });
  } catch (err) {
    next(err);
  }
}