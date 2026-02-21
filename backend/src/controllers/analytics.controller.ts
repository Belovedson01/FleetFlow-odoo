import type { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { asyncHandler } from '../utils/http';
import { buildAnalyticsCsv, getAnalyticsData, getDashboardData } from '../services/analytics.service';

const inr = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(value);

export const getDashboardController = asyncHandler(async (_req: Request, res: Response) => {
  const dashboard = await getDashboardData();
  res.json(dashboard);
});

export const getAnalyticsController = asyncHandler(async (_req: Request, res: Response) => {
  const analytics = await getAnalyticsData();
  res.json(analytics);
});

export const exportAnalyticsCsvController = asyncHandler(async (_req: Request, res: Response) => {
  const csv = await buildAnalyticsCsv();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="fleetflow-analytics.csv"');
  res.send(csv);
});

export const exportAnalyticsPdfController = asyncHandler(async (_req: Request, res: Response) => {
  const analytics = await getAnalyticsData();
  const doc = new PDFDocument({ margin: 40 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk) => chunks.push(chunk));
  doc.on('end', () => {
    const buffer = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="fleetflow-analytics.pdf"');
    res.send(buffer);
  });

  doc.fontSize(18).text('FleetFlow Analytics Report');
  doc.moveDown();
  doc.fontSize(12).text(`Total Operational Cost: ${inr(analytics.kpis.totalOperationalCost)}`);
  doc.text(`Fleet ROI: ${(analytics.kpis.fleetRoi * 100).toFixed(2)}%`);
  doc.text(`Fleet Fuel Efficiency: ${analytics.kpis.fleetFuelEfficiency.toFixed(2)} km/l`);
  doc.moveDown();
  doc.fontSize(14).text('Vehicle Breakdown');
  doc.moveDown(0.5);

  analytics.vehicles.forEach((row) => {
    doc
      .fontSize(10)
      .text(
        `${row.vehicleName} (${row.licensePlate}) | Revenue: ${inr(row.revenue)} | Cost: ${inr(row.totalOperationalCost)} | ROI: ${(row.roi * 100).toFixed(2)}%`
      );
  });

  doc.end();
});
