START TRANSACTION;
ALTER TABLE "RestaurantSettings" ADD "KhqrImageUrl" character varying(1000);

INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
VALUES ('20261111042614_AddKhqrImageUrl', '10.0.14');

COMMIT;

